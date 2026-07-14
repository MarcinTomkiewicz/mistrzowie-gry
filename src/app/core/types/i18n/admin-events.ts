export type ListPageCopy = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
};

export type CoreTableCopy = {
  name: string;
  key: string;
  shortDescription: string;
  active: string;
  publicPage: string;
  displayOrder: string;
  editionCount: string;
  activeEditionCount: string;
  updatedAt: string;
  actions: string;
  notAvailable: string;
};

export type ListActionsCopy = {
  createCore: string;
  activateCore: string;
  deactivateCore: string;
};

export type ListToastCopy = {
  loadFailedSummary: string;
  activateSuccessSummary: string;
  activateSuccessDetail: string;
  deactivateSuccessSummary: string;
  deactivateSuccessDetail: string;
  activationFailedSummary: string;
};

export type EditorPageCopy = {
  createTitle: string;
  editTitle: string;
  subtitle: string;
  loadErrorTitle: string;
  notFoundTitle: string;
  notFoundDescription: string;
};

export type EditorFieldsCopy = {
  coreSectionTitle: string;
  key: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  isActive: string;
  hasPublicPage: string;
  displayOrder: string;
};

export type EditorValidationCopy = {
  keyPattern: string;
  displayOrderMin: string;
};

export type EditionsCopy = {
  sectionTitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type EditionTableCopy = {
  city: string;
  slug: string;
  active: string;
  defaultPublic: string;
  displayOrder: string;
  occurrenceCount: string;
  programItemCount: string;
};

export type EditorToastCopy = {
  loadFailedSummary: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
};

export type StatusCopy = {
  active: string;
  inactive: string;
};

export type CoreRpcErrorsCopy = {
  forbidden: string;
  notFound: string;
  invalid: string;
  duplicateKey: string;
  constraint: string;
  conflict: string;
  unknown: string;
};
