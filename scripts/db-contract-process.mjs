import { execFile, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';

const execute = promisify(execFile);

export class SnapshotFailure extends Error {}

function commandFailure(stage, stderr = '') {
  const reason = /42501|permission denied|must be (?:owner|superuser)/i.test(stderr)
    ? 'insufficient privileges; verify schema USAGE, catalog SELECT, and EXECUTE on snapshot/definition functions'
    : /28P01|28000|authentication failed/i.test(stderr)
      ? 'PostgreSQL authentication failed'
      : 'command, connection, or timeout failure; raw diagnostics suppressed';
  return new SnapshotFailure(`${stage}: ${reason}.`);
}

export async function runSafe(command, args, stage) {
  try {
    const result = await execute(command, args, {
      encoding: 'utf8', timeout: 180_000, maxBuffer: 128 * 1024 * 1024,
    });
    // execFile rejects nonzero exits; successful docker pulls may report progress on stderr.
    const acceptsDiagnostics = command === 'docker' && args[0] === 'pull';
    if (!acceptsDiagnostics && result.stderr.trim()) throw commandFailure(stage, result.stderr);
    return result.stdout;
  } catch (error) {
    if (error instanceof SnapshotFailure) throw error;
    throw commandFailure(stage, typeof error.stderr === 'string' ? error.stderr : '');
  }
}

export function openSnapshot(connection, schemas) {
  const child = spawn('psql', [
    `--dbname=${connection}`, '--no-psqlrc', '--no-password', '--quiet',
    '--tuples-only', '--no-align', '--set=ON_ERROR_STOP=1',
    '--set=VERBOSITY=sqlstate', `--set=application_schemas=${JSON.stringify(schemas)}`,
  ], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stderr = '';
  let ioFailed = false;
  child.stderr.on('data', (data) => { stderr += data.toString(); });
  // Surface subprocess/pipe errors through safe diagnostics, never Error objects containing argv.
  child.stdin.on('error', () => { ioFailed = true; });
  child.on('error', () => { ioFailed = true; });
  const closed = new Promise((resolve) => child.once('close', resolve));
  const lines = createInterface({ input: child.stdout })[Symbol.asyncIterator]();

  return {
    async query(sql) {
      let timer;
      try {
        child.stdin.write(`${sql}\n`);
        const line = await Promise.race([
          lines.next(),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(commandFailure('Metadata query', stderr)), 45_000);
          }),
        ]);
        if (line.done || ioFailed || stderr.trim()) throw commandFailure('Metadata query', stderr);
        return JSON.parse(line.value);
      } catch (error) {
        if (error instanceof SnapshotFailure) throw error;
        throw commandFailure('Metadata query', stderr);
      } finally {
        clearTimeout(timer);
      }
    },
    async finish() {
      child.stdin.end('ROLLBACK;\n\\q\n');
      const code = await closed;
      if (code !== 0 || ioFailed || stderr.trim()) throw commandFailure('Read-only transaction', stderr);
    },
    abort() {
      child.stdin.destroy();
      child.kill();
    },
  };
}
