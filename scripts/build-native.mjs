import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const nativeDir = path.join(root, 'native');

execSync('cargo build --release', { cwd: nativeDir, stdio: 'inherit' });

const libName = 'neon_demo_native';
const built =
	process.platform === 'win32'
		? `${libName}.dll`
		: process.platform === 'darwin'
			? `lib${libName}.dylib`
			: `lib${libName}.so`;

const from = path.join(nativeDir, 'target', 'release', built);
const to = path.join(nativeDir, 'index.node');
copyFileSync(from, to);
console.log(`native addon ready: ${path.relative(root, to)}`);
