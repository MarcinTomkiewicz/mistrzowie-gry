import { spawn } from 'node:child_process';

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

const ng = spawn('npx', ['ng', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

ng.on('exit', (code) => {
  process.exit(code ?? 0);
});