import {
  AdminCoworkerSigningSourceCode,
  AdminCoworkerSigningSourceVersionStatus,
} from '../admin-coworker-signing-source';
import { CoworkerOnboardingStatus } from '../coworker-document';

export interface AdminCoworkerSigningSourcePageTranslations {
  title: string;
  subtitle: string;
}

export interface AdminCoworkerSigningSourceSectionTranslations {
  globalTitle: string;
  globalSubtitle: string;
  individualTitle: string;
  individualSubtitle: string;
  detailTitle: string;
  historyTitle: string;
  historyEmpty: string;
  sourceNotCreated: string;
  onboardingEmpty: string;
}

export interface AdminCoworkerSigningSourceFieldTranslations {
  globalSource: string;
  coworker: string;
  onboarding: string;
  version: string;
  size: string;
  createdAt: string;
  finalizedAt: string;
  publishedAt: string;
}

export interface AdminCoworkerSigningSourceActionTranslations {
  loadOnboarding: string;
  uploadVersion: string;
  publishVersion: string;
  downloadVersion: string;
}

export interface AdminCoworkerSigningSourceStatusTranslations {
  sources: Record<AdminCoworkerSigningSourceCode, string>;
  versions: Record<AdminCoworkerSigningSourceVersionStatus, string>;
  onboarding: Record<CoworkerOnboardingStatus, string>;
  onboardingCreated: string;
  onboardingExisting: string;
}

export interface AdminCoworkerSigningSourceUploadTranslations {
  chooseFile: string;
  dropFile: string;
  formats: string;
  reserving: string;
  uploading: string;
  finalizing: string;
  cancelling: string;
}

export interface AdminCoworkerSigningSourceMessageTranslations {
  uploadCompleted: string;
  publishCompleted: string;
  publishConfirmation: string;
}

export interface AdminCoworkerSigningSourceErrorTranslations {
  loadCatalog: string;
  loadDetail: string;
  loadOnboarding: string;
  invalidFilename: string;
  invalidMimeType: string;
  invalidFileSize: string;
  reserve: string;
  upload: string;
  finalize: string;
  cancel: string;
  cleanup: string;
  publish: string;
  download: string;
}
