import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const baseHref = process.env.APP_BASE_HREF ?? '/';

const normalized =
  baseHref === '/' ? '/' : baseHref.replace(/\/?$/, '/');

console.log('SSR build config');
console.log('APP_BASE_HREF:', normalized);

const args = [
  'build',
  '--base-href',
  normalized,
  '--deploy-url',
  normalized,
];

const angularCli = fileURLToPath(
  new URL('../node_modules/@angular/cli/bin/ng.js', import.meta.url),
);
const ng = spawn(process.execPath, [angularCli, ...args], {
  stdio: 'inherit',
  env: process.env,
});

let spawnFailed = false;

ng.once('error', (error) => {
  spawnFailed = true;
  console.error('[build:ssr] Failed to start Angular build:', error.message);
  process.exitCode = 1;
});

ng.once('close', (code, signal) => {
  if (spawnFailed) return;

  if (signal) {
    console.error(`[build:ssr] Angular build terminated by signal ${signal}`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = code ?? 1;
});
