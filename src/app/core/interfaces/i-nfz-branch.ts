import { IStaticReferenceCatalogMetadata } from './i-reference-catalog';

export interface INfzBranch {
  readonly code: string;
  readonly voivodeshipName: string;
  readonly officialName: string;
  readonly seat: string;
}

export interface INfzBranchCatalog {
  readonly metadata: IStaticReferenceCatalogMetadata;
  readonly branches: readonly INfzBranch[];
}
