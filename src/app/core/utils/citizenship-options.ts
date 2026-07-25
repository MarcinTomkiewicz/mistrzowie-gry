import { CITIZENSHIP_CATALOG } from '../configs/reference-catalogs/citizenships.config';
import type { ISelectOption } from '../interfaces/i-select-option';
import type { CitizenshipCatalogValue } from '../types/citizenship-catalog-value';

const citizenshipByNormalizedValue = new Map<string, CitizenshipCatalogValue>(
  CITIZENSHIP_CATALOG.values.map((value) => [
    normalizeCitizenshipValue(value),
    value,
  ]),
);
const citizenshipValues: ReadonlySet<string> = new Set(
  CITIZENSHIP_CATALOG.values,
);

export const CITIZENSHIP_OPTIONS: readonly ISelectOption<CitizenshipCatalogValue>[] =
  CITIZENSHIP_CATALOG.values.map((value) => ({ value, label: value }));

export function normalizeKnownCitizenship(value: string): string {
  return citizenshipByNormalizedValue.get(normalizeCitizenshipValue(value))
    ?? value;
}

export function isCitizenshipCatalogValue(
  value: string,
): value is CitizenshipCatalogValue {
  return citizenshipValues.has(value);
}

function normalizeCitizenshipValue(value: string): string {
  return value.trim().toLocaleLowerCase('pl');
}
