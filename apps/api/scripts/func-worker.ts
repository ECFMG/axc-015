import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const supportedVersionsPattern = /const supportedVersions = \[([^\]]*)\]/;

function resolveFuncBinary(): string {
	const configured = process.env['FUNC_PATH'];
	if (configured) {
		return realpathSync(configured);
	}

	const located = execFileSync('which', ['func'], { encoding: 'utf8' }).trim();
	if (!located) {
		throw new Error('Azure Functions Core Tools (func) was not found on PATH');
	}
	return realpathSync(located);
}

/**
 * Core Tools workers older than the Node 24 allowlist exit before the host can
 * serve HTTP. When the bundled worker omits the running Node major, copy it
 * and extend that allowlist. The Functions host and the `@apps/api` bundle stay
 * the same.
 *
 * @returns Worker directory for `languageWorkers__node__workerDirectory`, or
 * `undefined` when the bundled worker already allows this Node version.
 */
export function ensureNodeWorker(): string | undefined {
	const major = `v${process.versions.node.split('.')[0] ?? ''}`;
	const sourceDir = path.join(path.dirname(resolveFuncBinary()), 'workers', 'node');
	const entry = path.join(sourceDir, 'dist', 'src', 'nodejsWorker.js');
	const source = readFileSync(entry, 'utf8');
	const match = supportedVersionsPattern.exec(source);
	if (!match?.[1]) {
		throw new Error(`Could not read supported Node versions from ${entry}`);
	}
	if (match[1].includes(`'${major}'`)) {
		return undefined;
	}

	const destinationDir = path.join(os.tmpdir(), 'axc-func-node-worker');
	cpSync(sourceDir, destinationDir, { recursive: true });
	const patched = source.replace(match[0], `const supportedVersions = [${match[1]}, '${major}']`);
	writeFileSync(path.join(destinationDir, 'dist', 'src', 'nodejsWorker.js'), patched);
	return destinationDir;
}
