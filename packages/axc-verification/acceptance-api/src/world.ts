import { registerManagedSerenityWorld } from '@cellix/serenity-framework/cucumber';
import type { ApiInfrastructureState } from '@cellix/serenity-framework/infrastructure/api';
import { SerenityCast } from '@cellix/serenity-framework/serenity';
import { CallAnApi } from '@serenity-js/rest';
import { registerLifecycleHooks } from './cucumber-lifecycle-hooks.ts';
import { infrastructure } from './infrastructure.ts';

export const AgentCoursesApiWorld = registerManagedSerenityWorld({
	infrastructure,
	validateState: (state) => {
		if (!apiOrigin(state)) {
			throw new Error('API acceptance infrastructure did not expose an API url');
		}
	},
	createCast: (state) =>
		new SerenityCast({
			useNotepad: true,
			abilities: [() => CallAnApi.at(apiOrigin(state))],
		}),
});

export type AgentCoursesApiWorld = InstanceType<typeof AgentCoursesApiWorld>;

registerLifecycleHooks();

function apiOrigin(state: ApiInfrastructureState): string {
	// biome-ignore lint/complexity/useLiteralKeys: servers is an index signature
	const apiServer = state.servers['api'];
	if (!apiServer?.isRunning()) {
		return '';
	}
	return new URL(apiServer.getUrl()).origin;
}
