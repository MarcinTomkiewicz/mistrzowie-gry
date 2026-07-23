import {
  type ReserveSigningSourceUploadPayload,
  SIGNING_SOURCE_RPC,
  SIGNING_SOURCE_SHA256_BASE64_PATTERN,
  SIGNING_SOURCE_STORAGE_BUCKET,
  SIGNING_SOURCE_VERSION_STATUSES,
  SigningSourceBackendContractError,
  signingSourceReaders,
  type SigningSourceUploadActivation,
  type SigningSourceUploadReservation,
  type SigningSourceUploadTarget,
  UPLOAD_SESSION_STATUSES,
} from "./signing-source-contracts.ts";

const {
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendNullablePatternString,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = signingSourceReaders;

const RESERVATION_KEYS = [
  "sourceId",
  "sourceCreated",
  "sourceVersionId",
  "versionNumber",
  "uploadSessionId",
  "sessionStatus",
  "bucket",
  "path",
  "originalFilename",
  "storedFilename",
  "declaredMimeType",
  "expectedSizeBytes",
  "expiresAt",
] as const;

const ACTIVATION_KEYS = [
  "sourceId",
  "sourceVersionId",
  "uploadSessionId",
  "bucket",
  "path",
  "expectedSizeBytes",
  "expectedMimeType",
  "issuedAt",
  "expiresAt",
] as const;

const TARGET_KEYS = [
  "uploadSessionId",
  "sessionStatus",
  "finalized",
  "sourceId",
  "sourceVersionId",
  "sourceVersionStatus",
  "bucket",
  "path",
  "expectedSizeBytes",
  "expectedMimeType",
  "expiresAt",
  "contentSha256Base64",
] as const;

export interface SigningSourceUploadExpectation {
  sourceId: string;
  sourceVersionId: string;
  uploadSessionId: string;
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  expectedMimeType: string;
}

export function parseSigningSourceUploadReservation(
  value: unknown,
  payload: ReserveSigningSourceUploadPayload,
): SigningSourceUploadReservation {
  const rpcName = SIGNING_SOURCE_RPC.reserveUpload;
  const result = backendObject(value, rpcName, RESERVATION_KEYS);
  const parsed: SigningSourceUploadReservation = {
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceCreated: backendBoolean(result, "sourceCreated", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    versionNumber: backendPositiveInteger(result, "versionNumber", rpcName),
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    sessionStatus: backendLiteral(result, "sessionStatus", "created", rpcName),
    bucket: backendString(result, "bucket", rpcName),
    path: backendString(result, "path", rpcName),
    originalFilename: backendString(result, "originalFilename", rpcName),
    storedFilename: backendString(result, "storedFilename", rpcName),
    declaredMimeType: backendString(result, "declaredMimeType", rpcName),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      rpcName,
    ),
    expiresAt: backendTimestamp(result, "expiresAt", rpcName),
  };

  if (
    (payload.sourceId !== null && parsed.sourceId !== payload.sourceId) ||
    parsed.bucket !== SIGNING_SOURCE_STORAGE_BUCKET ||
    parsed.originalFilename !== payload.originalFilename ||
    parsed.declaredMimeType !== payload.declaredMimeType ||
    parsed.expectedSizeBytes !== payload.sizeBytes
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningSourceUploadActivation(
  value: unknown,
  expected: SigningSourceUploadExpectation,
): SigningSourceUploadActivation {
  const rpcName = SIGNING_SOURCE_RPC.activateUpload;
  const result = backendObject(value, rpcName, ACTIVATION_KEYS);
  const parsed: SigningSourceUploadActivation = {
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    bucket: backendString(result, "bucket", rpcName),
    path: backendString(result, "path", rpcName),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      rpcName,
    ),
    expectedMimeType: backendString(result, "expectedMimeType", rpcName),
    issuedAt: backendTimestamp(result, "issuedAt", rpcName),
    expiresAt: backendTimestamp(result, "expiresAt", rpcName),
  };

  if (
    parsed.sourceId !== expected.sourceId ||
    parsed.sourceVersionId !== expected.sourceVersionId ||
    parsed.uploadSessionId !== expected.uploadSessionId ||
    parsed.bucket !== expected.bucket ||
    parsed.path !== expected.path ||
    parsed.expectedSizeBytes !== expected.expectedSizeBytes ||
    parsed.expectedMimeType !== expected.expectedMimeType
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningSourceUploadTarget(
  value: unknown,
  uploadSessionId: string,
): SigningSourceUploadTarget {
  const rpcName = SIGNING_SOURCE_RPC.getUploadTarget;
  const result = backendObject(value, rpcName, TARGET_KEYS);
  const parsed: SigningSourceUploadTarget = {
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    sessionStatus: backendEnum(
      result,
      "sessionStatus",
      UPLOAD_SESSION_STATUSES,
      rpcName,
    ),
    finalized: backendBoolean(result, "finalized", rpcName),
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    sourceVersionStatus: backendEnum(
      result,
      "sourceVersionStatus",
      SIGNING_SOURCE_VERSION_STATUSES,
      rpcName,
    ),
    bucket: backendString(result, "bucket", rpcName),
    path: backendString(result, "path", rpcName),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      rpcName,
    ),
    expectedMimeType: backendString(result, "expectedMimeType", rpcName),
    expiresAt: backendTimestamp(result, "expiresAt", rpcName),
    contentSha256Base64: backendNullablePatternString(
      result,
      "contentSha256Base64",
      SIGNING_SOURCE_SHA256_BASE64_PATTERN,
      rpcName,
    ),
  };

  if (
    parsed.uploadSessionId !== uploadSessionId ||
    parsed.bucket !== SIGNING_SOURCE_STORAGE_BUCKET ||
    parsed.finalized !== (parsed.sessionStatus === "finalized")
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}
