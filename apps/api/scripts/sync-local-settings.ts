import { AzureFunctionsLocalSettings } from '@cellix/local-dev';

new AzureFunctionsLocalSettings({
	values: {
		FUNCTIONS_WORKER_RUNTIME: 'node',
		AzureWebJobsFeatureFlags: 'EnableWorkerIndexing',
	},
}).sync();
