import { COUNTRY_CODE_CATALOG } from '../configs/reference-catalogs/country-codes.config';
import { ISelectOption } from '../interfaces/i-select-option';
import { CountryCode } from '../types/country-code';

export function buildCountryOptions(
  locale: string,
): ISelectOption<CountryCode>[] {
  const displayNames = typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames([locale], { type: 'region' })
    : null;
  const collator = new Intl.Collator(locale);

  return COUNTRY_CODE_CATALOG.codes
    .map((code) => ({
      value: code,
      label: displayNames?.of(code) ?? code,
    }))
    .sort((left, right) => {
      if (left.value === 'PL') return -1;
      if (right.value === 'PL') return 1;

      return (
        collator.compare(left.label, right.label) ||
        left.value.localeCompare(right.value)
      );
    });
}
