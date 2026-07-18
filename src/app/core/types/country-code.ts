import { COUNTRY_CODE_CATALOG } from '../configs/reference-catalogs/country-codes.config';

export type CountryCode = (typeof COUNTRY_CODE_CATALOG.codes)[number];
