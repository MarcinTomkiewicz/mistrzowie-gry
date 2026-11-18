#!/usr/bin/env node
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCANNER_IMAGE, sealArtifact, verifyNoCredentials, writeJson } from './db-contract-artifact.mjs';
import { openSnapshot, runSafe, SnapshotFailure } from './db-contract-process.mjs';

// Supabase-owned namespaces are inventoried, but only auth/storage definitions are exported.
// An unknown namespace is never silently omitted: add application namespaces in workflow_dispatch.
const PLATFORM_SCHEMAS = new Set([
  'auth', 'storage', 'extensions', 'graphql', 'graphql_public', 'realtime',
  'supabase_functions', 'supabase_migrations', 'vault', 'pgsodium', 'pgsodium_masks',
  'net', 'cron', '_analytics', '_realtime', '_supavisor', 'supavisor', 'pgbouncer',
]);
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const readSql = (name) => readFileSync(join(scriptDirectory, name), 'utf8');

function scopeFromInput(value) {
  const schemas = [...new Set(value.split(',').map((name) => name.trim()))].sort();
  if (!schemas.length || schemas.some((name) =>
    !/^[a-z_][a-z0-9_]{0,62}$/.test(name) || name.startsWith('pg_') ||
    name === 'information_schema' || PLATFORM_SCHEMAS.has(name))) {
    throw new SnapshotFailure('application_schemas must name application schemas only (for example public,private).');
  }
  return schemas;
}

function validateInventory(inventory, schemas) {
  if (inventory.missingPrivileges.length) {
    throw new SnapshotFailure(`Missing required privileges: ${inventory.missingPrivileges.join('; ')}.`);
  }
  if (inventory.missingSchemas.length) throw new SnapshotFailure('A requested application/auth/storage schema does not exist.');
  const omitted = inventory.schemas.filter((name) => !schemas.includes(name) && !PLATFORM_SCHEMAS.has(name));
  if (omitted.length) {
    const names = omitted.every((name) => /^[a-z_][a-z0-9_]{0,62}$/.test(name))
      ? omitted.join(', ') : 'one or more non-standard identifiers (not logged)';
    throw new SnapshotFailure(`Unselected application schemas: ${names}. Update application_schemas; no artifact published.`);
  }
  if (!/^[\dA-F]+-[\dA-F]+-\d+$/i.test(inventory.snapshot)) throw new SnapshotFailure('A synchronized database snapshot could not be exported.');
  const major = Math.floor(inventory.serverVersionNumber / 10_000);
  if (!Number.isInteger(major) || major < 15 || major > 99) throw new SnapshotFailure('Catalog export requires PostgreSQL 15 or newer.');
  return major;
}

async function exportSchema(connection, inventory, schemas, major) {
  const image = `postgres:${major}`;
  await runSafe('docker', ['pull', '--quiet', image], 'Matching PostgreSQL client installation');
  const clientVersion = (await runSafe('docker', ['run', '--rm', image, 'pg_dump', '--version'], 'pg_dump version check')).trim();
  if (!clientVersion.startsWith(`pg_dump (PostgreSQL) ${major}.`)) throw new SnapshotFailure('pg_dump/server major versions do not match.');

  const schemaSql = await runSafe('docker', [
    'run', '--rm', '--network', 'host', '--env', 'SUPABASE_DB_URL',
    '--env', 'PGCONNECT_TIMEOUT', '--env', 'PGSSLMODE', image, 'sh', '-c',
    'exec pg_dump --dbname="$SUPABASE_DB_URL" "$@"', 'snapshot-pg-dump',
    '--schema-only', '--format=plain', '--no-password', '--strict-names',
    '--lock-wait-timeout=10s', `--snapshot=${inventory.snapshot}`,
    ...schemas.map((name) => `--schema="${name}"`), '--schema=auth', '--schema=storage',
  ], 'Schema export (all warnings are fatal)');
  if (!schemaSql.includes('PostgreSQL database dump complete')) throw new SnapshotFailure('Schema export is incomplete.');
  verifyNoCredentials(schemaSql, connection);
  return { schemaSql, clientVersion };
}

async function main() {
  const connection = process.env.SUPABASE_DB_URL;
  if (!connection) throw new SnapshotFailure('GitHub Secret SUPABASE_DB_URL is missing or empty.');
  const url = new URL(connection);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new SnapshotFailure('SUPABASE_DB_URL must be a PostgreSQL URL.');
  const schemas = scopeFromInput(process.env.APPLICATION_SCHEMAS ?? '');
  const runnerTemp = resolve(process.env.RUNNER_TEMP);
  const destination = resolve(process.env.SNAPSHOT_DIRECTORY);
  if (destination !== join(runnerTemp, 'db-contract-snapshot') || existsSync(destination)) {
    throw new SnapshotFailure('Snapshot output directory is invalid or already exists.');
  }
  const workDirectory = mkdtempSync(join(runnerTemp, 'db-contract-private-'));
  const payload = join(workDirectory, 'payload');
  mkdirSync(payload, { mode: 0o700 });
  const startedAt = new Date().toISOString();
  const session = openSnapshot(connection, schemas);
  try {
    const inventory = await session.query(readSql('db-contract-preflight.sql'));
    const major = validateInventory(inventory, schemas);
    console.log('Read-only preflight: complete schema coverage and required privileges verified.');
    const { schemaSql, clientVersion } = await exportSchema(connection, inventory, schemas, major);
    const metadata = await session.query(readSql('db-contract-metadata.sql'));
    await session.finish();
    const sections = [
      'routines', 'triggers', 'policies', 'relations', 'columnGrants', 'schemaGrants',
      'defaultGrants', 'roles', 'memberships', 'extensions', 'buckets', 'databaseGrants', 'parameterGrants',
    ];
    if (Object.keys(metadata).length !== sections.length || sections.some((name) => !Array.isArray(metadata[name]))) {
      throw new SnapshotFailure('Metadata export is incomplete.');
    }
    writeFileSync(join(payload, 'schema.sql'), schemaSql, { mode: 0o600 });
    for (const name of sections) writeJson(payload, name, metadata[name]);
    writeJson(payload, 'schema-inventory', {
      applicationSchemas: schemas, platformDefinitionSchemas: ['auth', 'storage'],
      excludedPlatformSchemas: inventory.schemas.filter((name) => PLATFORM_SCHEMAS.has(name) && !['auth', 'storage'].includes(name)),
    });
    writeFileSync(join(payload, 'README.txt'), [
      'Database contract snapshot - documentation, not a restore/migration script.',
      'schema.sql: application + auth/storage schema-only DDL, owners, functions/RPCs, triggers, RLS and grants.',
      'JSON files: full catalog metadata for the declared schemas; global role attributes and memberships.',
      'buckets.json: bucket id/name/public/file_size_limit/allowed_mime_types only.',
      'No user records, object/file records or content, table data, role passwords, role/database settings, or Vault secret values.',
      'Extension dependencies are inventoried by name/version, not expanded into platform implementation DDL.',
      'All database reads share one exported REPEATABLE READ / READ ONLY snapshot.',
      'manifest.json hashes cover payload files. SHA256SUMS.txt also covers manifest.json (not itself).',
      'Secret detection is mandatory; scanner failure, findings, dump warnings, missing scope or privileges prevent publication.',
      '',
    ].join('\n'), { mode: 0o600 });
    await sealArtifact(payload, {
      status: 'COMPLETE', startedAt, completedAt: new Date().toISOString(),
      serverVersion: inventory.serverVersion, serverVersionNumber: inventory.serverVersionNumber,
      pgDumpVersion: clientVersion, applicationSchemas: schemas, platformDefinitionSchemas: ['auth', 'storage'],
      exportMode: 'schema-only + whitelisted catalog/bucket metadata; no user or object data',
      consistency: 'shared exported REPEATABLE READ READ ONLY snapshot',
      secretScanner: SCANNER_IMAGE,
      recordCounts: Object.fromEntries(sections.map((name) => [name, metadata[name].length])),
    }, connection);
    renameSync(payload, destination);
    console.log('Validated export prepared. PASS is reported only after artifact upload succeeds.');
  } finally {
    session.abort();
    rmSync(workDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  let message = error instanceof SnapshotFailure ? error.message : 'Unexpected export failure; raw diagnostics suppressed.';
  if (process.env.SUPABASE_DB_URL) {
    try { verifyNoCredentials(message, process.env.SUPABASE_DB_URL); }
    catch { message = 'Export failed; sensitive diagnostics suppressed.'; }
  }
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
});
