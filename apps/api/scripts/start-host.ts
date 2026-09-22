import { spawn } from 'node:child_process';
import { AzureFunctionsLocalSettings } from '@cellix/local-dev';
import { ensureNodeWorker } from './func-worker.ts';

const port = process.env['PORT'] ?? '7071';
const workerDirectory = ensureNodeWorker();

new AzureFunctionsLocalSettings({
	values: {
		FUNCTIONS_WORKER_RUNTIME: 'node',
		AzureWebJobsFeatureFlags: 'EnableWorkerIndexing',
	},
}).sync();

const child = spawn('func', ['start', '--typescript', '--script-root', 'deploy/', '--port', port, '--cors', '*'], {
	stdio: ['ignore', 'pipe', 'pipe'],
	env: {
		...process.env,
		...(workerDirectory ? { languageWorkers__node__workerDirectory: workerDirectory } : {}),
	},
});

child.stdout?.on('data', (chunk: Buffer) => {
	process.stdout.write(chunk);
});
child.stderr?.on('data', (chunk: Buffer) => {
	process.stdout.write(chunk);
});
child.on('exit', (code) => {
	process.exit(code ?? 1);
});
