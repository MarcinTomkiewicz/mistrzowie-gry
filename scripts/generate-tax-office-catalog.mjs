import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import XLSX from 'xlsx';

const GENERATOR_VERSION = '1.0.1';
const SOURCE = 'https://www.gov.pl/web/kas/dane-teleadresowe-jednostek-kas';
const OUTPUT_PATH = resolve(
  'src/app/core/configs/reference-catalogs/tax-offices.generated.json',
);
const SOURCE_FILE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SOURCE_TYPE = 'US';
const TAX_OFFICE_CODE_PATTERN = /^\d{4}$/;

const [sourcePath, sourceFileDate] = process.argv.slice(2);

if (sourcePath === undefined || !isCalendarDate(sourceFileDate)) {
  throw new Error(
    'Usage: npm run generate:tax-offices -- <source.xlsx> <source-file-date: YYYY-MM-DD>',
  );
}

const workbook = XLSX.readFile(resolve(sourcePath));
const sheetName = workbook.SheetNames[0];

if (sheetName === undefined) {
  throw new Error('The XLSX workbook does not contain a worksheet.');
}

const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
  defval: '',
  raw: false,
});
const taxOffices = [];
const codes = new Set();

for (const [index, row] of rows.entries()) {
  if (normalize(row['TYP']) !== SOURCE_TYPE) {
    continue;
  }

  const taxOffice = {
    code: normalize(row['KOD JEDNOSTKI']),
    name: normalize(row['NAZWA URZĘDU']),
    city: normalize(row['MIASTO']),
  };

  if (!TAX_OFFICE_CODE_PATTERN.test(taxOffice.code)) {
    throw new Error(`Invalid tax office code in XLSX row ${index + 2}: ${taxOffice.code}.`);
  }

  if (taxOffice.name === '' || taxOffice.city === '') {
    throw new Error(`Invalid tax office record in XLSX row ${index + 2}.`);
  }

  if (codes.has(taxOffice.code)) {
    throw new Error(`Duplicate tax office code: ${taxOffice.code}.`);
  }

  codes.add(taxOffice.code);
  taxOffices.push(taxOffice);
}

if (taxOffices.length === 0) {
  throw new Error('The XLSX workbook does not contain tax office records of type US.');
}

taxOffices.sort((left, right) => left.code.localeCompare(right.code, 'en'));

const catalog = {
  metadata: {
    source: SOURCE,
    sourceFileDate,
    generatedAt: new Date().toISOString(),
    generatorVersion: GENERATOR_VERSION,
  },
  taxOffices,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');

console.log(`Generated ${taxOffices.length} tax offices in ${OUTPUT_PATH}.`);

function normalize(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function isCalendarDate(value) {
  if (value === undefined || !SOURCE_FILE_DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
