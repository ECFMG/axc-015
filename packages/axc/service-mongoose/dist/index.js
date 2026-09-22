import { MongoMemoryServer } from 'mongodb-memory-server-core';
/** Local and test MongoDB process. Uses mongodb-memory-server-core so installs do not run package build scripts. */
export function createMemoryMongoServer() {
    return new MongoMemoryServer();
}
//# sourceMappingURL=index.js.map