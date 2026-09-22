import { ArtifactArchiver, configure } from '@serenity-js/core';
import { SerenityBDDReporter } from '@serenity-js/serenity-bdd';

const serenityBddReporter = SerenityBDDReporter.fromJSON({
	specDirectory: './src/features',
}) as unknown as ReturnType<typeof ArtifactArchiver.fromJSON>;

configure({
	crew: [
		ArtifactArchiver.fromJSON({
			outputDirectory: './target/site/serenity',
		}),
		serenityBddReporter,
	],
});
