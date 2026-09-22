export const HEALTH_SERVICE_NAME = 'agentCourses-api';
export const HEALTH_PROJECT_CODE = 'axc';
export function resolveEnvironment(nodeEnv) {
    if (nodeEnv === 'production') {
        return 'production';
    }
    if (nodeEnv === 'test') {
        return 'test';
    }
    return 'local';
}
export function buildApplicationServicesFactory(context) {
    const forRequest = () => Promise.resolve({
        health: {
            getStatus() {
                return {
                    status: 'ok',
                    service: HEALTH_SERVICE_NAME,
                    projectCode: HEALTH_PROJECT_CODE,
                    environment: context.environment,
                    timestamp: new Date().toISOString(),
                };
            },
        },
    });
    return { forRequest };
}
//# sourceMappingURL=index.js.map