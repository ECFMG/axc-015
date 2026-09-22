import { spawnSync } from 'node:child_process';

function run(args) {
	return spawnSync('snyk', args, { encoding: 'utf8' });
}

const version = run(['--version']);
if (version.status !== 0) {
	console.log('Snyk: SKIPPED');
	console.log('Reason: the snyk CLI is not available on PATH.');
	console.log('This is NON-BLOCKING for the first scaffold only. Install the Snyk CLI and authenticate before treating security results as enforced.');
	process.exit(0);
}

const token = process.env.SNYK_TOKEN?.trim();
const config = run(['config', 'get', 'api']);
const configuredToken = config.status === 0 ? config.stdout.trim() : '';
if (!token && (!configuredToken || configuredToken === 'null' || configuredToken === 'undefined')) {
	console.log('Snyk: SKIPPED');
	console.log('Reason: Snyk credentials are unavailable. Set SNYK_TOKEN or run `snyk auth`.');
	console.log('Organization slug: agentcourses. Monitor and --remote-repo-url are intentionally not used.');
	console.log('This is NON-BLOCKING for the first scaffold only.');
	process.exit(0);
}

console.log('Snyk: running snyk test --all-projects --org=agentcourses (local CLI, no monitor, no --remote-repo-url)');
const test = spawnSync('snyk', ['test', '--all-projects', '--org=agentcourses'], { stdio: 'inherit' });
process.exit(test.status ?? 1);
