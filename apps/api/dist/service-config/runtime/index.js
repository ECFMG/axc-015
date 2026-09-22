import { resolveEnvironment } from '@axc/application-services';
// biome-ignore lint/complexity/useLiteralKeys: ProcessEnv.NODE_ENV is an index signature under noPropertyAccessFromIndexSignature
export const environment = resolveEnvironment(process.env['NODE_ENV']);
//# sourceMappingURL=index.js.map