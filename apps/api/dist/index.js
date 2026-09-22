import { buildApplicationServicesFactory } from '@axc/application-services';
import { restHandlerCreator } from '@axc/rest';
import { Cellix } from '@cellix/api-core';
import * as RuntimeConfig from './service-config/runtime/index.js';
Cellix.initializeInfrastructureServices((serviceRegistry) => {
    void serviceRegistry;
})
    .setContext(() => {
    return {
        environment: RuntimeConfig.environment,
    };
})
    .initializeApplicationServices((context) => buildApplicationServicesFactory(context))
    .registerAzureFunctionHttpHandler('health', { route: 'health', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
    .startUp();
//# sourceMappingURL=index.js.map