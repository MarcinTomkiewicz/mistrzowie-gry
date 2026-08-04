export const ADMIN_COWORKER_SIGNING_SOURCE_ACTION = {
  getCatalog: 'getSigningSourceCatalog',
  getDetail: 'getSigningSourceDetail',
  reserveUpload: 'reserveSigningSourceUpload',
  recoverUpload: 'recoverSigningSourceUpload',
  finalizeUpload: 'finalizeSigningSourceUpload',
  cancelUpload: 'cancelSigningSourceUpload',
  publishVersion: 'publishSigningSourceVersion',
  downloadVersion: 'downloadSigningSourceVersion',
} as const;

export const ADMIN_COWORKER_SIGNING_SOURCE_TYPES = [
  'global_template',
  'onboarding_case',
] as const;

export const ADMIN_COWORKER_SIGNING_SOURCE_CODES = [
  'safety_protocol',
  'cooperation_rules',
  'loyalty_rules',
  'mandate_contract',
] as const;

export const ADMIN_COWORKER_GLOBAL_SIGNING_SOURCE_CODES = [
  'safety_protocol',
  'cooperation_rules',
  'loyalty_rules',
] as const;

export const ADMIN_COWORKER_SIGNING_SOURCE_VERSION_STATUSES = [
  'reserved',
  'uploaded',
  'ready',
  'published',
  'superseded',
  'deleted',
] as const;

export type AdminCoworkerSigningSourceType =
  (typeof ADMIN_COWORKER_SIGNING_SOURCE_TYPES)[number];
export type AdminCoworkerSigningSourceCode =
  (typeof ADMIN_COWORKER_SIGNING_SOURCE_CODES)[number];
export type AdminCoworkerGlobalSigningSourceCode =
  (typeof ADMIN_COWORKER_GLOBAL_SIGNING_SOURCE_CODES)[number];
export type AdminCoworkerSigningSourceVersionStatus =
  (typeof ADMIN_COWORKER_SIGNING_SOURCE_VERSION_STATUSES)[number];

export type AdminCoworkerSigningSourceTarget = {
  readonly sourceId: string | null;
  readonly sourceType: AdminCoworkerSigningSourceType;
  readonly sourceCode: AdminCoworkerSigningSourceCode;
  readonly onboardingCaseId: string | null;
};

export type AdminCoworkerSigningSourceUploadPayload =
  AdminCoworkerSigningSourceTarget & {
    readonly originalFilename: string;
    readonly declaredMimeType: string;
    readonly sizeBytes: number;
  };

export type AdminCoworkerSigningSourceUploadState =
  | 'idle'
  | 'reserving'
  | 'uploading'
  | 'finalizing'
  | 'cancelling';

export type AdminCoworkerSigningSourceActionRequest =
  | {
      readonly action: typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.getCatalog;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.getDetail;
      readonly sourceId: string;
    }
  | {
      readonly action: typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.reserveUpload;
      readonly upload: AdminCoworkerSigningSourceUploadPayload;
    }
  | {
      readonly action:
        | typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.recoverUpload
        | typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.finalizeUpload
        | typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.cancelUpload;
      readonly uploadSessionId: string;
    }
  | {
      readonly action:
        | typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.publishVersion
        | typeof ADMIN_COWORKER_SIGNING_SOURCE_ACTION.downloadVersion;
      readonly sourceVersionId: string;
    };
