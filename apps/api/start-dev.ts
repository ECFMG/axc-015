import { AzureFunctionsDevRunner } from '@cellix/local-dev';
import { ensureNodeWorker } from './scripts/func-worker.ts';

const workerDirectory = ensureNodeWorker();
if (workerDirectory) {
	process.env['languageWorkers__node__workerDirectory'] = workerDirectory;
}

new AzureFunctionsDevRunner({
	localSettings: {
		values: {
			FUNCTIONS_WORKER_RUNTIME: 'node',
			AzureWebJobsFeatureFlags: 'EnableWorkerIndexing',
		},
	},
}).start();
