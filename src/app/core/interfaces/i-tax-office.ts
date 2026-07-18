import { IGeneratedReferenceCatalogMetadata } from './i-reference-catalog';

export interface ITaxOffice {
  readonly code: string;
  readonly name: string;
  readonly city: string;
}

export interface ITaxOfficeCatalog {
  readonly metadata: IGeneratedReferenceCatalogMetadata;
  readonly taxOffices: readonly ITaxOffice[];
}
