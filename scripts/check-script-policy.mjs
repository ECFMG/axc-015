import { readFileSync } from 'node:fs';

const npmrc = readFileSync(new URL('../.npmrc', import.meta.url), 'utf8');
if (!/^ignore-scripts=true$/m.test(npmrc)) {
	console.error('dependency script policy failed: .npmrc must set ignore-scripts=true');
	process.exit(1);
}

const workspace = readFileSync(new URL('../pnpm-workspace.yaml', import.meta.url), 'utf8');
const allowBuilds = workspace.split('allowBuilds:')[1] ?? '';
const enabled = [...allowBuilds.matchAll(/^ {2}(?:'[^']+'|[^:\n]+): true$/gm)].map((match) => match[0].trim());
if (enabled.length > 0) {
	console.error(`dependency script policy failed: allowBuilds must not enable scripts (${enabled.join(', ')})`);
	process.exit(1);
}

console.log('dependency script policy: ignore-scripts=true and allowBuilds does not enable dependency scripts');
