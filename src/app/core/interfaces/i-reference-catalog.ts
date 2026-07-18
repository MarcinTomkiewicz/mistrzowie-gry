export interface IGeneratedReferenceCatalogMetadata {
  readonly source: string;
  readonly sourceFileDate: string;
  readonly generatedAt: string;
  readonly generatorVersion: string;
}

export interface IStaticReferenceCatalogMetadata {
  readonly sources: readonly string[];
  readonly verifiedAt: string;
  readonly catalogVersion: string;
}
