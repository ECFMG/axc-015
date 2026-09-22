import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';
export function createRestApp(applicationServicesFactory) {
    const app = new Hono();
    app.get('/health', async (c) => {
        const authorization = c.req.header('Authorization');
        const applicationServices = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
        return c.json(applicationServices.health.getStatus());
    });
    return app;
}
export const restHandlerCreator = (applicationServicesFactory) => {
    const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
    return (request, context) => handler(request, context);
};
//# sourceMappingURL=index.js.map