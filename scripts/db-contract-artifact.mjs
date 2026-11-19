import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { SnapshotFailure } from './db-contract-process.mjs';

export function writeJson(directory, name, value) {
  writeFileSync(`${directory}/${name}.json`, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
}

export function sealArtifact(directory, manifest) {
  const files = readdirSync(directory).sort();
  const sha256 = (name) => createHash('sha256').update(readFileSync(`${directory}/${name}`)).digest('hex');
  manifest.files = Object.fromEntries(files.map((name) => [name, { sha256: sha256(name) }]));
  writeJson(directory, 'manifest', manifest);
  files.push('manifest.json');
  const expectedHashes = new Map(files.sort().map((name) => [name, sha256(name)]));
  writeFileSync(`${directory}/SHA256SUMS.txt`, [...expectedHashes].map(([name, hash]) => `${hash}  ${name}\n`).join(''), { mode: 0o600 });

  for (const name of readdirSync(directory)) {
    if (!lstatSync(`${directory}/${name}`).isFile()) throw new SnapshotFailure('Unexpected artifact entry.');
  }

  for (const [name, expected] of expectedHashes) {
    if (sha256(name) !== expected) throw new SnapshotFailure('Artifact checksum mismatch.');
  }
}
