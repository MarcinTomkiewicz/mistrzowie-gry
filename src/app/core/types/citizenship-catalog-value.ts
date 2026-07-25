import { CITIZENSHIP_CATALOG } from '../configs/reference-catalogs/citizenships.config';

export type CitizenshipCatalogValue =
  (typeof CITIZENSHIP_CATALOG.values)[number];
