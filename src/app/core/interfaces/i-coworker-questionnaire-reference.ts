export interface ICoworkerQuestionnaireCatalogReference {
  kind: 'catalog';
  code: string;
  name: string;
}

export interface ICoworkerQuestionnaireLegacyReference {
  kind: 'legacy';
  code: null;
  name: string;
}
