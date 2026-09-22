import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type DependencyRulesTestsConfig, describeDependencyRulesTests } from '@cellix/archunit-tests/general';
import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const config: DependencyRulesTestsConfig = {
	appsGlob: '../../../apps/**',
	packagesGlob: '../../**',
	domainFolder: '../../axc/domain',
	persistenceFolder: '../../axc/persistence',
	applicationServicesFolder: '../../axc/application-services',
	restFolder: '../../axc/rest',
	infrastructurePattern: '../../axc/service-mongoose/**',
	restInfrastructurePattern: '../../axc/service-mongoose/**',
};

describeDependencyRulesTests(config);

const forbiddenDomainImports = ['hono', '@azure/', 'mongoose', 'mongodb', '@axc/rest', '@axc/persistence', '@axc/service-mongoose', '@axc/application-services'];

describe('domain import boundary', () => {
	it('domain sources do not import delivery or persistence implementations', async () => {
		const domainSrc = path.resolve(packageDir, '../../axc/domain/src');
		const files = await listTypeScriptFiles(domainSrc);
		expect(files.length).toBeGreaterThan(0);
		for (const file of files) {
			const text = await readFile(file, 'utf8');
			for (const specifier of forbiddenDomainImports) {
				expect(text.includes(`'${specifier}`) || text.includes(`"${specifier}`), `${path.basename(file)} imports ${specifier}`).toBe(false);
			}
		}
	});

	it('domain does not depend on the rest package', async () => {
		await projectFiles().inFolder(path.resolve(packageDir, '../../axc/domain')).shouldNot().dependOnFiles().inFolder(path.resolve(packageDir, '../../axc/rest')).check();
	});
});

async function listTypeScriptFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const entryPath = path.join(directory, entry.name);
			if (entry.isDirectory()) {
				return await listTypeScriptFiles(entryPath);
			}
			return entry.name.endsWith('.ts') ? [entryPath] : [];
		}),
	);
	return files.flat();
}
