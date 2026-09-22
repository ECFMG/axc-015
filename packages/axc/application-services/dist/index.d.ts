export declare const HEALTH_SERVICE_NAME: 'agentCourses-api';
export declare const HEALTH_PROJECT_CODE: 'axc';
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
}
export interface ApplicationServicesFactory {
    forRequest(rawAuthHeader?: string): Promise<ApplicationServices>;
}
export declare function resolveEnvironment(nodeEnv: string | undefined): HealthEnvironment;
export declare function buildApplicationServicesFactory(context: ApiContext): ApplicationServicesFactory;
