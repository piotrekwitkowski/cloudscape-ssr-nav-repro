import { build } from 'vite';
import { rmSync } from 'node:fs';

rmSync('dist', { recursive: true, force: true });

console.log('Building client assets (CSS extraction)...');
await build({ build: { outDir: 'dist/client' } });

console.log('\nBuilding SSR generator...');
await build({ build: { ssr: 'src/entry-static.tsx', outDir: 'dist/server' } });

globalThis[Symbol.for('awsui-visual-refresh-flag')] = () => true;
globalThis[Symbol.for('awsui-global-flags')] = { appLayoutToolbar: true };

console.log('\nGenerating static HTML pages...');
await import('./dist/server/entry-static.js');

rmSync('dist/client', { recursive: true, force: true });
rmSync('dist/server', { recursive: true, force: true });

console.log('\nDone! Static pages in dist/');
