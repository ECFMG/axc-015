import { app } from '@azure/functions';
import api, { SpanStatusCode, trace } from '@opentelemetry/api';
export class Cellix {
    contextInternal;
    appServicesHostInternal;
    contextCreatorInternal;
    appServicesHostBuilder;
    tracer;
    servicesInternal = new Map();
    /**
     * Optional name-based registry for services. Names are semantic strings that
     * allow multiple instances of the same constructor to coexist under
     * different names.
     */
    nameMap = new Map();
    pendingHandlers = [];
    serviceInitializedInternal = false;
    phase = 'infrastructure';
    constructor() {
        this.tracer = trace.getTracer('cellix:bootstrap');
    }
    /**
     * Begins configuring a Cellix application by registering infrastructure services.
     *
     * @remarks
     * This is the first step in the bootstrap sequence. It constructs a new Cellix instance in the
     * {@link Phase | 'infrastructure'} phase, invokes your `registerServices` callback to register
     * infrastructure services, and returns a {@link ContextBuilder} to define the infrastructure context.
     *
     * The typical flow is: {@link initializeInfrastructureServices} → {@link setContext} →
     * {@link initializeApplicationServices} → {@link registerAzureFunctionHttpHandler} → {@link startUp}.
     *
     * @typeParam ContextType - The shape of your infrastructure context that will be created in {@link setContext}.
     * @typeParam AppServices - The application services host type produced by {@link initializeApplicationServices}.
     *
     * @param registerServices - Callback invoked once to register infrastructure services.
     * @returns A {@link ContextBuilder} for defining the infrastructure context.
     *
     * @example
     * ```ts
     * Cellix.initializeInfrastructureServices((r) => {
     *   r.registerInfrastructureService(new BlobStorageService(...));
     *   r.registerInfrastructureService(new TokenValidationService(...));
     * })
     * .setContext((registry) => buildInfraContext(registry))
     * .initializeApplicationServices((ctx) => createAppHost(ctx))
     * .registerAzureFunctionHttpHandler('graphql', { authLevel: 'anonymous' }, (host) => async (req, fnCtx) => {
     *   const app = await host.forRequest(req.headers.get('authorization') ?? undefined);
     *   return app.GraphQL.handle(req, fnCtx);
     * })
     * .startUp();
     * ```
     */
    static initializeInfrastructureServices(registerServices) {
        const instance = new Cellix();
        registerServices(instance);
        return instance;
    }
    registerInfrastructureService(service, name) {
        this.ensurePhase('infrastructure');
        const key = service.constructor;
        if (name == null) {
            // Backwards-compatible constructor-only registration: preserve existing
            // behaviour and throw if the constructor key is already present.
            if (this.servicesInternal.has(key)) {
                throw new Error(`Service already registered for constructor: ${service.constructor.name}`);
            }
            this.servicesInternal.set(key, service);
        }
        else {
            // Name-based registration: ensure name uniqueness, but allow the same
            // constructor to exist under multiple names.
            if (this.nameMap.has(name)) {
                throw new Error(`Service name already registered: ${name}`);
            }
            this.nameMap.set(name, service);
        }
        return this;
    }
    setContext(contextCreator) {
        this.ensurePhase('infrastructure');
        this.contextCreatorInternal = contextCreator;
        this.phase = 'context';
        return this;
    }
    initializeApplicationServices(factory) {
        this.ensurePhase('context');
        if (!this.contextCreatorInternal) {
            throw new Error('Context creator must be set before initializing application services');
        }
        this.appServicesHostBuilder = factory;
        this.phase = 'app-services';
        return this;
    }
    registerAzureFunctionHttpHandler(name, options, handlerCreator) {
        this.ensurePhase('app-services', 'handlers');
        this.pendingHandlers.push({ name, options, handlerCreator });
        this.phase = 'handlers';
        return this;
    }
    startUp() {
        this.ensurePhase('handlers', 'app-services');
        if (!this.contextCreatorInternal) {
            throw new Error('Context not configured. Call setContext() first.');
        }
        this.setupLifecycle();
        this.phase = 'started';
        return Promise.resolve(this);
    }
    setupLifecycle() {
        // Register function handlers (deferred execution of creators)
        for (const h of this.pendingHandlers) {
            app.http(h.name, {
                ...h.options,
                handler: (request, context) => {
                    if (!this.appServicesHostInternal) {
                        throw new Error('Application not started yet');
                    }
                    return h.handlerCreator(this.appServicesHostInternal, this)(request, context);
                },
            });
        }
        // appStart hook
        app.hook.appStart(async () => {
            const root = api.context.active();
            await api.context.with(root, async () => {
                await this.tracer.startActiveSpan('cellix.appStart', async (span) => {
                    try {
                        await this.startAllServicesWithTracing();
                        this.serviceInitializedInternal = true;
                        if (!this.contextCreatorInternal) {
                            throw new Error('Context creator missing at appStart');
                        }
                        this.contextInternal = this.contextCreatorInternal(this);
                        if (!this.appServicesHostBuilder) {
                            throw new Error('Application services factory not provided. Call initializeApplicationServices().');
                        }
                        this.appServicesHostInternal = this.appServicesHostBuilder(this.contextInternal);
                        span.setStatus({ code: SpanStatusCode.OK });
                        console.log('Cellix started');
                    }
                    catch (err) {
                        span.setStatus({ code: SpanStatusCode.ERROR });
                        if (err instanceof Error) {
                            span.recordException(err);
                        }
                        throw err;
                    }
                    finally {
                        span.end();
                    }
                });
            });
        });
        // appTerminate hook
        app.hook.appTerminate(async () => {
            const root = api.context.active();
            await api.context.with(root, async () => {
                await this.tracer.startActiveSpan('cellix.appTerminate', async (span) => {
                    try {
                        await this.stopAllServicesWithTracing();
                        span.setStatus({ code: SpanStatusCode.OK, message: 'Cellix stopped successfully' });
                        console.log('Cellix stopped');
                    }
                    catch (err) {
                        span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : 'Shutdown failed' });
                        if (err instanceof Error) {
                            span.recordException(err);
                        }
                        throw err;
                    }
                    finally {
                        span.end();
                    }
                });
            });
        });
    }
    ensurePhase(...allowed) {
        if (!allowed.includes(this.phase)) {
            throw new Error(`Invalid operation in phase '${this.phase}'. Allowed phases: ${allowed.join(', ')}`);
        }
    }
    getInfrastructureService(serviceKeyOrName) {
        if (typeof serviceKeyOrName === 'string') {
            const named = this.nameMap.get(serviceKeyOrName);
            if (!named) {
                throw new Error(`Service not found: ${serviceKeyOrName}`);
            }
            return named;
        }
        const service = this.servicesInternal.get(serviceKeyOrName);
        if (!service) {
            const name = serviceKeyOrName.name ?? 'UnknownService';
            throw new Error(`Service not found: ${name}`);
        }
        return service;
    }
    get servicesInitialized() {
        return this.serviceInitializedInternal;
    }
    get context() {
        if (!this.contextInternal) {
            throw new Error('Context not initialized');
        }
        return this.contextInternal;
    }
    get applicationServices() {
        if (!this.appServicesHostInternal) {
            throw new Error('Application services not initialized');
        }
        return this.appServicesHostInternal;
    }
    // Service lifecycle helpers
    async startAllServicesWithTracing() {
        const services = this.getUniqueServicesForLifecycle();
        await this.iterateServicesWithTracing(services, 'start', 'startUp');
    }
    async stopAllServicesWithTracing() {
        const services = this.getUniqueServicesForLifecycle();
        await this.iterateServicesWithTracing(services, 'stop', 'shutDown');
    }
    getUniqueServicesForLifecycle() {
        const set = new Set();
        for (const svc of this.servicesInternal.values()) {
            set.add(svc);
        }
        for (const svc of this.nameMap.values()) {
            set.add(svc);
        }
        return Array.from(set.values());
    }
    async iterateServicesWithTracing(services, operationName, serviceMethod) {
        const operationFullName = `${operationName.charAt(0).toUpperCase() + operationName.slice(1)}Service`;
        const operationActionPending = operationName === 'start' ? 'starting' : 'stopping';
        const operationActionCompleted = operationName === 'start' ? 'started' : 'stopped';
        await Promise.all(services.map((service) => this.tracer.startActiveSpan(`Service ${service.constructor.name} ${operationName}`, async (span) => {
            try {
                const ctorName = service.constructor?.name ?? 'Service';
                console.log(`${operationFullName}: Service ${ctorName} ${operationActionPending}`);
                await service[serviceMethod]();
                span.setStatus({ code: SpanStatusCode.OK, message: `Service ${ctorName} ${operationActionCompleted}` });
                console.log(`${operationFullName}: Service ${ctorName} ${operationActionCompleted}`);
            }
            catch (err) {
                span.setStatus({ code: SpanStatusCode.ERROR, message: err instanceof Error ? err.message : 'Service operation failed' });
                if (err instanceof Error) {
                    span.recordException(err);
                }
                throw err;
            }
            finally {
                span.end();
            }
        })));
    }
}
//# sourceMappingURL=cellix.js.map