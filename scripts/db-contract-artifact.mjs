import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { runSafe, SnapshotFailure } from './db-contract-process.mjs';

export const SCANNER_IMAGE = 'ghcr.io/gitleaks/gitleaks:v8.30.1@sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f';

const FORBIDDEN_CONTENT = [
  /(?:postgres(?:ql)?|https?):\/\/[^\s'"<>]+:[^\s'"<>]+@/i,
  /\bpostgres(?:ql)?:\/\/[^\s'"<>]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
  /\bsb_(?:secret|publishable)_[A-Za-z0-9_-]+/,
  /[?&](?:token|api[_-]?key|password|secret)=[^&\s'"<>]+/i,
  /\b(?:PASSWORD|CONNECTION)\s+'[^']+'/i,
  /\b(?:password|passwd)\s*=\s*[^\s'";,)}]+/i,
  /\b(?:password|passwd|api[_-]?key|secret|token)\s*(?:=|:=|:)\s*["'][^"']{4,}["']/i,
];

export function verifyNoCredentials(text, connection) {
  const url = new URL(connection);
  const password = decodeURIComponent(url.password);
  const querySecrets = [...url.searchParams].filter(([key]) => /password|secret|token|key/i.test(key)).map(([, value]) => value);
  const sensitive = [connection, decodeURIComponent(connection), url.password, password, ...querySecrets];
  const variants = sensitive.filter(Boolean).flatMap((value) => [
    value, JSON.stringify(value).slice(1, -1), value.replaceAll("'", "''"),
    Buffer.from(value).toString('base64'), Buffer.from(value).toString('hex'),
  ]);
  if (variants.some((value) => text.includes(value)) || FORBIDDEN_CONTENT.some((rule) => rule.test(text))) {
    throw new SnapshotFailure('Credential/connection-string check failed; nothing will be published.');
  }
}

export function writeJson(directory, name, value) {
  writeFileSync(`${directory}/${name}.json`, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

export async function sealArtifact(directory, manifest, connection) {
  const files = readdirSync(directory).sort();
  const sha256 = (name) => createHash('sha256').update(readFileSync(`${directory}/${name}`)).digest('hex');
  manifest.files = Object.fromEntries(files.map((name) => [name, { sha256: sha256(name) }]));
  writeJson(directory, 'manifest', manifest);
  files.push('manifest.json');
  const expectedHashes = new Map(files.sort().map((name) => [name, sha256(name)]));
  writeFileSync(`${directory}/SHA256SUMS.txt`, [...expectedHashes].map(([name, hash]) => `${hash}  ${name}\n`).join(''), { mode: 0o600 });

  for (const name of readdirSync(directory)) {
    if (!lstatSync(`${directory}/${name}`).isFile()) throw new SnapshotFailure('Unexpected artifact entry.');
    verifyNoCredentials(readFileSync(`${directory}/${name}`, 'utf8'), connection);
  }

  await runSafe('docker', ['pull', '--quiet', SCANNER_IMAGE], 'Secret scanner installation');
  await runSafe('docker', [
    'run', '--rm', '--network', 'none', '--read-only', '--cap-drop=ALL',
    '--user', `${process.getuid()}:${process.getgid()}`,
    '--mount', `type=bind,source=${directory},target=/scan,readonly`, SCANNER_IMAGE,
    'dir', '/scan', '--no-banner', '--redact', '--ignore-gitleaks-allow',
    '--max-decode-depth=3', '--exit-code=1', '--log-level=error',
  ], 'Secret scan (a finding or scanner failure blocks publication)');

  for (const [name, expected] of expectedHashes) {
    if (sha256(name) !== expected) throw new SnapshotFailure('Artifact checksum mismatch.');
  }
}
