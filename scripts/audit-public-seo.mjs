#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { runPublicSeoAudit } from './public-seo-audit.mjs';
import { formatPublicSeoAuditSummary } from './public-seo-audit-report.mjs';

const DEFAULT_PUBLIC_BASE_URL = 'https://mistrzowie-gry.pl';
const DEFAULT_OUTPUT_DIR = 'dist/public-seo-audit';

async function main() {
  const options = parseArguments(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  const originBaseUrl =
    options.originBaseUrl ?? process.env.ORIGIN_BASE_URL;
  const publicBaseUrl =
    options.publicBaseUrl ??
    process.env.PUBLIC_BASE_URL ??
    DEFAULT_PUBLIC_BASE_URL;

  if (!originBaseUrl) {
    throw new Error(
      'Missing --origin-base-url or ORIGIN_BASE_URL environment variable',
    );
  }

  const report = await runPublicSeoAudit({
    originBaseUrl,
    publicBaseUrl,
  });
  const outputDirectory = resolve(
    options.outputDirectory ?? DEFAULT_OUTPUT_DIR,
  );
  const jsonPath = resolve(outputDirectory, 'public-seo-audit.json');
  const summaryPath = resolve(outputDirectory, 'public-seo-audit.txt');
  const summary = formatPublicSeoAuditSummary(report);

  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  writeFileSync(summaryPath, summary, 'utf8');

  process.stdout.write(summary);
  console.log(`JSON: ${jsonPath}`);
  console.log(`Summary: ${summaryPath}`);

  if (report.totals.BLOCKER > 0) {
    process.exitCode = 1;
  }
}

function parseArguments(args) {
  const options = {
    help: false,
    originBaseUrl: null,
    publicBaseUrl: null,
    outputDirectory: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--help') {
      options.help = true;
      continue;
    }

    const value = args[index + 1];

    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`);
    }

    if (argument === '--origin-base-url') {
      options.originBaseUrl = value;
    } else if (argument === '--public-base-url') {
      options.publicBaseUrl = value;
    } else if (argument === '--output-dir') {
      options.outputDirectory = value;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }

    index += 1;
  }

  return options;
}

function printUsage() {
  console.log(`Usage:
  npm run audit:public-seo -- --origin-base-url <url> [options]

Options:
  --origin-base-url <url>  Origin SSR base URL; or set ORIGIN_BASE_URL
  --public-base-url <url>  Public base URL; defaults to ${DEFAULT_PUBLIC_BASE_URL}
  --output-dir <path>      Report directory; defaults to ${DEFAULT_OUTPUT_DIR}
  --help                   Show this help
`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[public-seo-audit] ${message}`);
  process.exitCode = 1;
});
