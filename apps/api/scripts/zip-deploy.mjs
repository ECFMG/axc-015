import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deployDir = path.join(appDir, 'deploy');
const zipPath = path.join(appDir, 'agentCourses-api.zip');

execFileSync('zip', ['-r', '-q', zipPath, '.'], { cwd: deployDir, stdio: 'inherit' });
console.log(`Azure Functions package: ${zipPath}`);
