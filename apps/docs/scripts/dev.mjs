import { spawn } from 'node:child_process';

const worktreeName = process.env.WORKTREE_NAME;
const hostname = worktreeName ? `docs.agentcourses.${worktreeName}.localhost` : 'docs.agentcourses.localhost';
const child = spawn('pnpm', ['exec', 'portless', hostname, '--force', 'node', 'start-dev.ts'], {
	stdio: 'inherit',
	env: process.env,
});

child.on('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 1);
});
