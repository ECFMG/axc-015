import { type HttpFunctionOptions, type HttpHandler } from '@azure/functions';
import type { ServiceBase } from '@cellix/api-services-spec';
interface InfrastructureServiceRegistry<ContextType = unknown, AppServices = unknown> {
    /**
     * Registers an infrastructure service with the application.
     *
     * @remarks
     * Must be called during the {@link Phase | 'infrastructure'} phase.
     * By default, services are keyed by constructor identity (minification-safe).
     * This method now has an optional `name` argument to allow registering
     * multiple instances of the same constructor under distinct string keys.
     *
     * @typeParam T - The concrete service type.
     * @param service - The service instance to register.
     * @param name - Optional semantic name for the service. If provided, the
     *               service will be retrievable by name via getInfrastructureService(name).
     * @returns The registry (for chaining).
     *
     * @throws Error - If called outside the infrastructure phase, the constructor key is already registered (when name is omitted),
     *                 or the provided name is already registered.
     */
    registerInfrastructureService<T extends ServiceBase>(service: T, name?: string): InfrastructureServiceRegistry<ContextType, AppServices>;
}
interface ContextBuilder<ContextType = unknown, AppServices = unknown> {
    /**
     * Defines the infrastructure context available for the application.
     *
     * @remarks
     * Must be called during the {@link Phase | 'infrastructure'} phase. Stores the `contextCreator`
     * and transitions the application to the {@link Phase | 'context'} phase. The provided function
     * will be invoked during {@link startUp} (inside the Azure Functions `appStart` hook) after all
     * infrastructure services have successfully started. Note that `ContextType` is defined in the
     * `api-context-spec` package.
     *
     * @param contextCreator - Function that builds the infrastructure context from the initialized service registry.
     * @returns An {@link ApplicationServicesInitializer} for configuring application services.
     *
     * @throws Error - If called outside the 'infrastructure' phase.
     */
    setContext(contextCreator: (serviceRegistry: InitializedServiceRegistry) => ContextType): ApplicationServicesInitializer<ContextType, AppServices>;
}
interface ApplicationServicesInitializer<ContextType, AppServices = unknown> {
    /**
     * Registers the factory that creates the request-scoped application services host.
     *
     * @remarks
     * Must be called during the {@link Phase | 'context'} phase, after {@link setContext}. Stores the
     * factory and transitions the application to the {@link Phase | 'app-services'} phase. The factory
     * will be invoked during {@link startUp} to produce an {@link AppHost} that can build
     * request-scoped services via {@link AppHost.forRequest}. Note that `AppServices` is defined in the
     * `api-application-services` package.
     *
     * @param factory - Function that produces the application services host from the infrastructure context.
     * @returns An {@link AzureFunctionHandlerRegistry} for registering HTTP handlers or starting the app.
     *
     * @throws Error - If the context creator has not been set via {@link setContext}, or if called outside the 'context' phase.
     *
     * @example
     * ```ts
     * initializeApplicationServices((infraCtx) => createAppHost(infraCtx))
     *   .registerAzureFunctionHttpHandler('health', { authLevel: 'anonymous' }, (host) => async (req, fnCtx) => {
     *     const app = await host.forRequest();
     *     return app.Health.handle(req, fnCtx);
     *   });
     * ```
     */
    initializeApplicationServices(factory: (infrastructureContext: ContextType) => AppHost<AppServices>): AzureFunctionHandlerRegistry<ContextType, AppServices>;
}
interface AzureFunctionHandlerRegistry<ContextType = unknown, AppServices = unknown> {
    /**
     * Registers an Azure Function HTTP endpoint.
     *
     * @remarks
     * The `handlerCreator` is invoked per request and receives the application services host and infrastructure registry.
     * Use it to create a request-scoped handler (e.g., to build per-request context).
     * Registration is allowed in phases `'app-services'` and `'handlers'`.
     *
     * @param name - Function name to bind in Azure Functions.
     * @param options - Azure Functions HTTP options (excluding the handler).
     * @param handlerCreator - Factory that, given the app services host and infrastructure registry, returns an `HttpHandler`.
     * @returns The registry (for chaining).
     *
     * @throws Error - If called before application services are initialized.
     *
     * @example
     * ```ts
     * registerAzureFunctionHttpHandler('graphql', { authLevel: 'anonymous' }, (host, infra) => {
     *   return async (req, ctx) => {
     *     const app = await host.forRequest(req.headers.get('authorization') ?? undefined);
     *     const apollo = infra.getInfrastructureService(ServiceApolloServer);
     *     return app.GraphQL.handle(req, ctx);
     *   };
     * });
     * ```
     */
    registerAzureFunctionHttpHandler(name: string, options: Omit<HttpFunctionOptions, 'handler'>, handlerCreator: (applicationServicesHost: AppHost<AppServices>, infrastructureRegistry: InitializedServiceRegistry) => HttpHandler): AzureFunctionHandlerRegistry<ContextType, AppServices>;
    /**
     * Finalizes configuration and starts the application.
     *
     * @remarks
     * This registers function handlers with Azure Functions, starts all infrastructure
     * services (in parallel), builds the infrastructure context, and initializes
     * application services. After this resolves, the application is in the `'started'` phase.
     *
     * @returns A promise that resolves to the started application facade.
     *
     * @throws Error - If the context builder or application services factory have not been configured.
     */
    startUp(): Promise<StartedApplication<ContextType>>;
}
interface StartedApplication<ContextType = unknown> extends InitializedServiceRegistry {
    get context(): ContextType;
}
interface InitializedServiceRegistry {
    /**
     * Retrieves a registered infrastructure service by its constructor key or by
     * its semantic name.
     *
     * @remarks
     * If a string `name` was used when registering the service, pass that name
     * to retrieve it. Otherwise, pass the service constructor used at
     * registration time.
     *
     * @typeParam T - The concrete service type.
     * @param serviceKeyOrName - The service class (constructor) or the string name used at registration time.
     * @returns The registered service instance.
     *
     * @throws Error - If no service is registered for the provided key or name.
     */
    getInfrastructureService<T extends ServiceBase>(serviceKeyOrName: ServiceKey<T> | string): T;
    get servicesInitialized(): boolean;
}
type UninitializedServiceRegistry<ContextType = unknown, AppServices = unknown> = InfrastructureServiceRegistry<ContextType, AppServices>;
type RequestScopedHost<S, H = unknown> = {
    forRequest(rawAuthHeader?: string, hints?: H): Promise<S>;
};
type AppHost<AppServices> = RequestScopedHost<AppServices, unknown>;
/**
 * Minification-safe key for service lookup: the service class (constructor).
 *
 * @remarks
 * Keys are compared by constructor identity. Pass the same class used at registration time.
 */
type ServiceKey<T extends ServiceBase = ServiceBase> = {
    prototype: T;
};
export declare class Cellix<ContextType, AppServices = unknown> implements InfrastructureServiceRegistry<ContextType, AppServices>, ContextBuilder<ContextType, AppServices>, ApplicationServicesInitializer<ContextType, AppServices>, AzureFunctionHandlerRegistry<ContextType, AppServices>, StartedApplication<ContextType> {
    private contextInternal;
    private appServicesHostInternal;
    private contextCreatorInternal;
    private appServicesHostBuilder;
    private readonly tracer;
    private readonly servicesInternal;
    /**
     * Optional name-based registry for services. Names are semantic strings that
     * allow multiple instances of the same constructor to coexist under
     * different names.
     */
    private readonly nameMap;
    private readonly pendingHandlers;
    private serviceInitializedInternal;
    private phase;
    private constructor();
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
    static initializeInfrastructureServices<ContextType, AppServices = unknown>(registerServices: (registry: UninitializedServiceRegistry<ContextType, AppServices>) => void): ContextBuilder<ContextType, AppServices>;
    registerInfrastructureService<T extends ServiceBase>(service: T, name?: string): InfrastructureServiceRegistry<ContextType, AppServices>;
    setContext(contextCreator: (serviceRegistry: InitializedServiceRegistry) => ContextType): ApplicationServicesInitializer<ContextType, AppServices>;
    initializeApplicationServices(factory: (infrastructureContext: ContextType) => RequestScopedHost<AppServices, unknown>): AzureFunctionHandlerRegistry<ContextType, AppServices>;
    registerAzureFunctionHttpHandler(name: string, options: Omit<HttpFunctionOptions, 'handler'>, handlerCreator: (applicationServicesHost: RequestScopedHost<AppServices, unknown>, infrastructureRegistry: InitializedServiceRegistry) => HttpHandler): AzureFunctionHandlerRegistry<ContextType, AppServices>;
    startUp(): Promise<StartedApplication<ContextType>>;
    private setupLifecycle;
    private ensurePhase;
    getInfrastructureService<T extends ServiceBase>(serviceKeyOrName: ServiceKey<T> | string): T;
    get servicesInitialized(): boolean;
    get context(): ContextType;
    get applicationServices(): RequestScopedHost<AppServices, unknown>;
    private startAllServicesWithTracing;
    private stopAllServicesWithTracing;
    private getUniqueServicesForLifecycle;
    private iterateServicesWithTracing;
}
export {};
