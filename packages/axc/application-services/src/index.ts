import type { CourseCatalog } from '@axc/domain';
import { createInMemoryCourseCatalog } from '@axc/persistence';
import { type CourseSearchService, createCourseSearch } from './course-search.ts';

export const HEALTH_SERVICE_NAME = 'agentCourses-api' as const;
export const HEALTH_PROJECT_CODE = 'axc' as const;

export type HealthEnvironment = 'local' | 'test' | 'production';

export interface HealthStatus {
	status: 'ok';
	service: typeof HEALTH_SERVICE_NAME;
	projectCode: typeof HEALTH_PROJECT_CODE;
	environment: HealthEnvironment;
	timestamp: string;
}

export interface ApiContext {
	environment: HealthEnvironment;
}

export interface ApplicationServices {
	health: {
		getStatus(): HealthStatus;
	};
	courses: CourseSearchService;
}

export interface ApplicationServicesFactory {
	forRequest(rawAuthHeader?: string): Promise<ApplicationServices>;
}

export interface ApplicationServicesDependencies {
	courseCatalog?: CourseCatalog;
}

export function resolveEnvironment(nodeEnv: string | undefined): HealthEnvironment {
	if (nodeEnv === 'production') {
		return 'production';
	}
	if (nodeEnv === 'test') {
		return 'test';
	}
	return 'local';
}

export function buildApplicationServicesFactory(context: ApiContext, dependencies?: ApplicationServicesDependencies): ApplicationServicesFactory {
	const courseCatalog = dependencies?.courseCatalog ?? createInMemoryCourseCatalog();
	const courses = createCourseSearch(courseCatalog);
	const forRequest = (): Promise<ApplicationServices> =>
		Promise.resolve({
			health: {
				getStatus(): HealthStatus {
					return {
						status: 'ok',
						service: HEALTH_SERVICE_NAME,
						projectCode: HEALTH_PROJECT_CODE,
						environment: context.environment,
						timestamp: new Date().toISOString(),
					};
				},
			},
			courses,
		});

	return { forRequest };
}

export type { CourseQueryErrorDetail, CourseQueryInput, CourseSearchService } from './course-search.ts';
export { InvalidCourseQueryError } from './course-search.ts';
