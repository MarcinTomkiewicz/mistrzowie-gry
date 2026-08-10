import type { CommercialConstantValueType } from '../commercial-constant-admin';
import type { CommercialConstantDurationUnit } from '../commercial-constant-editor-form';

export type AdminCommercialConstantsPageTranslations = {
  title: string;
  subtitle: string;
  backToPages: string;
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
  status: string;
  usage: string;
  draftUsage: string;
  publishedUsage: string;
  updatedAt: string;
  updatedBy: string;
  publishedAt: string;
  publishedBy: string;
};

export type AdminCommercialConstantsEditorTranslations = {
  createTitle: string;
  editTitle: string;
  token: string;
  tokenHint: string;
  label: string;
  type: string;
  value: string;
  durationUnit: string;
  identityLocked: string;
};

export type AdminCommercialConstantsActionTranslations = {
  publish: string;
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
  loadFailedSummary: string;
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
  integer: string;
  text: string;
};

export type AdminCommercialConstantsValueTypeTranslations = Record<
  CommercialConstantValueType,
  string
>;

export type AdminCommercialConstantsDurationUnitTranslations = Record<
  CommercialConstantDurationUnit,
  string
> & {
  hoursShort: string;
  minutesShort: string;
};
