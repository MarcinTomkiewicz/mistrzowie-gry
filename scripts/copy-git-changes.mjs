import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const OUTPUT_DIR = '.gitchanges';
const INCLUDED_EXTENSIONS = new Set(['.ts', '.html', '.json', '.scss']);
const EXCLUDED_FILENAMES = new Set(['spec.ts']);

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function isIncludedFile(filePath) {
  const fileName = basename(filePath);
  const extension = extname(filePath);

  if (EXCLUDED_FILENAMES.has(fileName)) {
    return false;
  }

  return INCLUDED_EXTENSIONS.has(extension);
}

function toSafeOutputName(filePath, usedNames) {
  const fileName = basename(filePath);

  if (!usedNames.has(fileName)) {
    usedNames.add(fileName);
    return fileName;
  }

  const extension = extname(fileName);
  const nameWithoutExtension = fileName.slice(0, fileName.length - extension.length);
  const pathPrefix = dirname(filePath)
    .split(/[\\/]/)
    .filter(Boolean)
    .join('__');

  const fallbackName = `${pathPrefix}__${nameWithoutExtension}${extension}`;

  if (!usedNames.has(fallbackName)) {
    usedNames.add(fallbackName);
    return fallbackName;
  }

  let index = 2;

  while (usedNames.has(`${pathPrefix}__${nameWithoutExtension}__${index}${extension}`)) {
    index += 1;
  }

  const indexedName = `${pathPrefix}__${nameWithoutExtension}__${index}${extension}`;
  usedNames.add(indexedName);

  return indexedName;
}

function main() {
  const stagedFiles = new Set(git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']));
  const unstagedFiles = git(['diff', '--name-only', '--diff-filter=ACMR']);
  const untrackedFiles = git(['ls-files', '--others', '--exclude-standard']);

  const filesToCopy = unique([...unstagedFiles, ...untrackedFiles])
    .filter((filePath) => !stagedFiles.has(filePath))
    .filter(isIncludedFile)
    .filter((filePath) => existsSync(filePath));

  if (existsSync(OUTPUT_DIR)) {
    rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const usedNames = new Set();

  for (const filePath of filesToCopy) {
    const outputName = toSafeOutputName(filePath, usedNames);
    const outputPath = join(OUTPUT_DIR, outputName);

    copyFileSync(filePath, outputPath);

    console.log(`${filePath} -> ${relative(process.cwd(), outputPath)}`);
  }

  console.log(`Copied ${filesToCopy.length} file(s) to ${OUTPUT_DIR}`);
}

main();