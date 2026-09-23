import type { ApplicationServicesFactory } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const applicationServices = await resolveApplicationServices(c.req.header('Authorization'), applicationServicesFactory);
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const applicationServices = await resolveApplicationServices(c.req.header('Authorization'), applicationServicesFactory);
		const result = applicationServices.courses.search({
			q: c.req.query('q'),
			modality: c.req.query('modality'),
			status: c.req.query('status'),
			tag: c.req.query('tag'),
			page: c.req.query('page'),
			pageSize: c.req.query('pageSize'),
			sort: c.req.query('sort'),
		});
		if (!result.ok) {
			return c.json({ error: result.error }, 400);
		}
		return c.json(result.value);
	});

	return app;
}

async function resolveApplicationServices(authorization: string | undefined, applicationServicesFactory: ApplicationServicesFactory) {
	return authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};
