import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, '..');
const viteBin = path.join(appDir, 'node_modules', 'vite', 'bin', 'vite.js');
const lockFile = path.join(appDir, 'package-lock.json');

if (existsSync(viteBin)) {
  process.exit(0);
}

console.log('[Nyou] Dependencias incompletas: falta vite. Reinstalando...');

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const args = existsSync(lockFile) ? ['ci'] : ['install'];
const result = spawnSync(command, args, {
  cwd: appDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
