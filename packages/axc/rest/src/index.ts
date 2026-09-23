import { type ApplicationServices, type ApplicationServicesFactory, InvalidCourseQueryError } from '@axc/application-services';
import type { HttpHandler, HttpRequest, InvocationContext } from '@azure/functions';
import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter';
import { Hono } from 'hono';

export function createRestApp(applicationServicesFactory: ApplicationServicesFactory): Hono {
	const app = new Hono();

	app.get('/health', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		return c.json(applicationServices.health.getStatus());
	});

	app.get('/api/courses', async (c) => {
		const applicationServices = await applicationServicesFor(applicationServicesFactory, c.req.header('Authorization'));
		try {
			const body = await applicationServices.courses.search(c.req.queries());
			return c.json(body);
		} catch (error) {
			if (error instanceof InvalidCourseQueryError) {
				return c.json(
					{
						error: {
							code: 'INVALID_QUERY_PARAMETER',
							message: error.message,
							details: [...error.details],
						},
					},
					400,
				);
			}
			throw error;
		}
	});

	return app;
}

export const restHandlerCreator = (applicationServicesFactory: ApplicationServicesFactory): HttpHandler => {
	const handler = azureHonoHandler(createRestApp(applicationServicesFactory).fetch);
	return (request: HttpRequest, context: InvocationContext) => handler(request, context);
};

function applicationServicesFor(applicationServicesFactory: ApplicationServicesFactory, authorization: string | undefined): Promise<ApplicationServices> {
	if (authorization === undefined) {
		return applicationServicesFactory.forRequest();
	}
	return applicationServicesFactory.forRequest(authorization);
}
