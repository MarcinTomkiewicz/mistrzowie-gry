import type { CommercialConstantValueType } from '../commercial-constant-admin';

export type AdminCommercialConstantsPageTranslations = {
  title: string;
  subtitle: string;
  create: string;
  publishAll: string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
};

export type AdminCommercialConstantsTableTranslations = {
  constant: string;
  type: string;
  draft: string;
  published: string;
  usage: string;
  draftUsage: string;
  publishedUsage: string;
  updatedAt: string;
  updatedBy: string;
};

export type AdminCommercialConstantsEditorTranslations = {
  createTitle: string;
  editTitle: string;
  token: string;
  tokenHint: string;
  type: string;
  value: string;
  durationUnit: string;
  identityLocked: string;
};

export type AdminCommercialConstantsActionTranslations = {
  copyToken: string;
  deleteUnavailable: string;
};

export type AdminCommercialConstantsStatusTranslations = {
  published: string;
  unpublished: string;
  draftChanged: string;
  draftCurrent: string;
};

export type AdminCommercialConstantsToastTranslations = {
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
  publishSuccessSummary: string;
  publishSuccessDetail: string;
  publishFailedSummary: string;
  publishFailedDetail: string;
  deleteSuccessSummary: string;
  deleteSuccessDetail: string;
  deleteFailedSummary: string;
  deleteFailedDetail: string;
  copySuccessSummary: string;
  copySuccessDetail: string;
  copyFailedSummary: string;
  copyFailedDetail: string;
};

export type AdminCommercialConstantsConfirmationTranslations = {
  delete: string;
};

export type AdminCommercialConstantsValidationTranslations = {
  token: string;
  duration: string;
  text: string;
};

export type AdminCommercialConstantsValueTypeTranslations = Record<
  Exclude<CommercialConstantValueType, 'duration'>,
  string
>;
