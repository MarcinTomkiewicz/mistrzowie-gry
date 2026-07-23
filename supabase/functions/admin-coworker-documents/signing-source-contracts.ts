import { createContractReaders } from "../_shared/coworker-document-edge/contract-readers.ts";

export const SIGNING_SOURCE_RPC = {
  getCatalog: "get_admin_coworker_signing_source_catalog",
  getDetail: "get_admin_coworker_signing_source_detail",
  reserveUpload: "reserve_admin_coworker_signing_source_upload",
  activateUpload: "activate_admin_coworker_signing_source_upload",
  getUploadTarget: "get_admin_coworker_signing_source_upload_target",
  finalizeUpload: "finalize_admin_coworker_signing_source_upload",
  cancelUpload: "cancel_admin_coworker_signing_source_upload",
  recordCleanup: "record_admin_coworker_signing_source_cleanup_result",
  publishVersion: "publish_admin_coworker_signing_source_version",
  getDownloadTarget: "get_admin_coworker_signing_source_download_target",
} as const;

export type SigningSourceRpcName =
  typeof SIGNING_SOURCE_RPC[keyof typeof SIGNING_SOURCE_RPC];

export type SigningSourceType = "global_template" | "onboarding_case";
export type SigningSourceCode =
  | "safety_protocol"
  | "cooperation_rules"
  | "loyalty_rules"
  | "mandate_contract";
export type SigningSourceVersionStatus =
  | "reserved"
  | "uploaded"
  | "ready"
  | "published"
  | "superseded"
  | "deleted";
export type UploadSessionStatus =
  | "created"
  | "uploaded"
  | "finalized"
  | "cancelled";
export type CleanupStatus =
  | "not_required"
  | "pending"
  | "completed"
  | "failed";

export const SIGNING_SOURCE_STORAGE_BUCKET = "coworker-documents";
export const SIGNING_SOURCE_SHA256_BASE64_PATTERN = /^[A-Za-z0-9+/]{43}=$/;

export interface ReserveSigningSourceUploadPayload {
  sourceId: string | null;
  sourceType: SigningSourceType;
  sourceCode: SigningSourceCode;
  onboardingCaseId: string | null;
  originalFilename: string;
  declaredMimeType: string;
  sizeBytes: number;
}

export type SigningSourceActionRequest =
  | { action: "getSigningSourceCatalog" }
  | { action: "getSigningSourceDetail"; sourceId: string }
  | {
    action: "reserveSigningSourceUpload";
    upload: ReserveSigningSourceUploadPayload;
  }
  | { action: "recoverSigningSourceUpload"; uploadSessionId: string }
  | { action: "finalizeSigningSourceUpload"; uploadSessionId: string }
  | { action: "cancelSigningSourceUpload"; uploadSessionId: string }
  | { action: "publishSigningSourceVersion"; sourceVersionId: string }
  | { action: "downloadSigningSourceVersion"; sourceVersionId: string };

export interface SigningSourceVersion {
  id: string;
  sourceId: string;
  versionNumber: number;
  status: SigningSourceVersionStatus;
  originalFilename: string;
  storedFilename: string;
  fileExtension: string;
  declaredMimeType: string;
  detectedMimeType: string | null;
  expectedSizeBytes: number;
  sizeBytes: number | null;
  contentSha256Base64: string | null;
  uploadedAt: string | null;
  finalizedAt: string | null;
  publishedAt: string | null;
  supersededAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicSigningSourceVersion = Omit<
  SigningSourceVersion,
  "contentSha256Base64"
>;

export interface SigningSourceCatalogItem {
  id: string;
  sourceType: SigningSourceType;
  sourceCode: SigningSourceCode;
  onboardingCaseId: string | null;
  userId: string | null;
  title: string;
  description: string | null;
  currentPublishedVersionId: string | null;
  currentPublishedVersionNumber: number | null;
  currentPublishedAt: string | null;
  latestVersionId: string | null;
  latestVersionNumber: number | null;
  latestVersionStatus: SigningSourceVersionStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface SigningSourceDetail extends SigningSourceCatalogItem {
  versions: PublicSigningSourceVersion[];
}

export interface SigningSourceUploadReservation {
  sourceId: string;
  sourceCreated: boolean;
  sourceVersionId: string;
  versionNumber: number;
  uploadSessionId: string;
  sessionStatus: "created";
  bucket: string;
  path: string;
  originalFilename: string;
  storedFilename: string;
  declaredMimeType: string;
  expectedSizeBytes: number;
  expiresAt: string;
}

export interface SigningSourceUploadActivation {
  sourceId: string;
  sourceVersionId: string;
  uploadSessionId: string;
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  expectedMimeType: string;
  issuedAt: string;
  expiresAt: string;
}

export interface SigningSourceUploadTarget {
  uploadSessionId: string;
  sessionStatus: UploadSessionStatus;
  finalized: boolean;
  sourceId: string;
  sourceVersionId: string;
  sourceVersionStatus: SigningSourceVersionStatus;
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  expectedMimeType: string;
  expiresAt: string;
  contentSha256Base64: string | null;
}

export interface SigningSourceUploadFinalization {
  sourceId: string;
  sourceVersionId: string;
  versionNumber: number;
  uploadSessionId: string;
  sourceVersionStatus: "ready";
  detectedMimeType: string;
  sizeBytes: number;
  contentSha256Base64: string;
  finalizedAt: string;
}

export type PublicSigningSourceUploadFinalization = Omit<
  SigningSourceUploadFinalization,
  "contentSha256Base64"
>;

export interface SigningSourceUploadCancellation {
  uploadSessionId: string;
  cancelled: true;
  cleanupStatus: CleanupStatus;
  cleanupTarget: {
    bucket: string;
    path: string;
  };
}

export interface SigningSourceCleanupResult {
  uploadSessionId: string;
  cleanupStatus: "completed" | "failed";
  cleanupAttemptedAt: string;
  cleanupCompletedAt: string | null;
  failureCode: string | null;
}

export interface SigningSourcePublishResult {
  sourceId: string;
  sourceVersionId: string;
  sourceCode: SigningSourceCode;
  versionNumber: number;
  status: "published";
  publishedAt: string;
  supersededVersionId: string | null;
  idempotent: boolean;
}

export interface SigningSourceDownloadTarget {
  sourceId: string;
  sourceVersionId: string;
  sourceCode: SigningSourceCode;
  bucket: string;
  path: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  signedUrlExpiresInSeconds: number;
}

export class SigningSourceBackendContractError extends Error {
  constructor(readonly rpcName: SigningSourceRpcName) {
    super("Signing source backend contract validation failed.");
    this.name = "SigningSourceBackendContractError";
  }
}

export class SigningSourceRequestValidationError extends Error {
  constructor(readonly fieldErrors: { [field: string]: string }) {
    super("Signing source request validation failed.");
    this.name = "SigningSourceRequestValidationError";
  }
}

export const SIGNING_SOURCE_ACTIONS = [
  "getSigningSourceCatalog",
  "getSigningSourceDetail",
  "reserveSigningSourceUpload",
  "recoverSigningSourceUpload",
  "finalizeSigningSourceUpload",
  "cancelSigningSourceUpload",
  "publishSigningSourceVersion",
  "downloadSigningSourceVersion",
] as const;

export const SIGNING_SOURCE_TYPES = [
  "global_template",
  "onboarding_case",
] as const;
export const SIGNING_SOURCE_CODES = [
  "safety_protocol",
  "cooperation_rules",
  "loyalty_rules",
  "mandate_contract",
] as const;
export const GLOBAL_SIGNING_SOURCE_CODES = [
  "safety_protocol",
  "cooperation_rules",
  "loyalty_rules",
] as const;
export const SIGNING_SOURCE_VERSION_STATUSES = [
  "reserved",
  "uploaded",
  "ready",
  "published",
  "superseded",
  "deleted",
] as const;
export const UPLOAD_SESSION_STATUSES = [
  "created",
  "uploaded",
  "finalized",
  "cancelled",
] as const;
export const CLEANUP_STATUSES = [
  "not_required",
  "pending",
  "completed",
  "failed",
] as const;

const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export const signingSourceReaders = createContractReaders<SigningSourceRpcName>(
  {
    createRequestError: (fieldErrors) =>
      new SigningSourceRequestValidationError(fieldErrors),
    createBackendError: (rpcName) =>
      new SigningSourceBackendContractError(rpcName),
    isTimestamp: (value) =>
      ISO_TIMESTAMP_PATTERN.test(value) &&
      !Number.isNaN(Date.parse(value)),
  },
);

export function isSigningSourceRpcName(
  value: string,
): value is SigningSourceRpcName {
  return Object.values(SIGNING_SOURCE_RPC).some((name) => name === value);
}
