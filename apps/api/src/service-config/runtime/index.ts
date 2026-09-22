import { type HealthEnvironment, resolveEnvironment } from '@axc/application-services';

// biome-ignore lint/complexity/useLiteralKeys: ProcessEnv.NODE_ENV is an index signature under noPropertyAccessFromIndexSignature
export const environment: HealthEnvironment = resolveEnvironment(process.env['NODE_ENV']);
