import {
  CLEANUP_STATUSES,
  type PublicSigningSourceUploadFinalization,
  SIGNING_SOURCE_CODES,
  SIGNING_SOURCE_RPC,
  SIGNING_SOURCE_SHA256_BASE64_PATTERN,
  SIGNING_SOURCE_STORAGE_BUCKET,
  SigningSourceBackendContractError,
  type SigningSourceCleanupResult,
  type SigningSourceDownloadTarget,
  type SigningSourcePublishResult,
  signingSourceReaders,
  type SigningSourceUploadCancellation,
  type SigningSourceUploadFinalization,
  type SigningSourceUploadTarget,
} from "./signing-source-contracts.ts";

const {
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendNullableString,
  backendNullableTimestamp,
  backendNullableUuid,
  backendObject,
  backendPatternString,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = signingSourceReaders;

export function parseSigningSourceUploadFinalization(
  value: unknown,
  target: SigningSourceUploadTarget,
): SigningSourceUploadFinalization {
  const rpcName = SIGNING_SOURCE_RPC.finalizeUpload;
  const result = backendObject(value, rpcName, [
    "sourceId",
    "sourceVersionId",
    "versionNumber",
    "uploadSessionId",
    "sourceVersionStatus",
    "detectedMimeType",
    "sizeBytes",
    "contentSha256Base64",
    "finalizedAt",
  ]);
  const parsed: SigningSourceUploadFinalization = {
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    versionNumber: backendPositiveInteger(result, "versionNumber", rpcName),
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    sourceVersionStatus: backendLiteral(
      result,
      "sourceVersionStatus",
      "ready",
      rpcName,
    ),
    detectedMimeType: backendString(result, "detectedMimeType", rpcName),
    sizeBytes: backendPositiveInteger(result, "sizeBytes", rpcName),
    contentSha256Base64: backendPatternString(
      result,
      "contentSha256Base64",
      SIGNING_SOURCE_SHA256_BASE64_PATTERN,
      rpcName,
    ),
    finalizedAt: backendTimestamp(result, "finalizedAt", rpcName),
  };

  if (
    parsed.sourceId !== target.sourceId ||
    parsed.sourceVersionId !== target.sourceVersionId ||
    parsed.uploadSessionId !== target.uploadSessionId ||
    parsed.sizeBytes !== target.expectedSizeBytes
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningSourceUploadCancellation(
  value: unknown,
  uploadSessionId: string,
): SigningSourceUploadCancellation {
  const rpcName = SIGNING_SOURCE_RPC.cancelUpload;
  const result = backendObject(value, rpcName, [
    "uploadSessionId",
    "cancelled",
    "cleanupStatus",
    "cleanupTarget",
  ]);
  const cleanupTarget = backendObject(
    result.cleanupTarget,
    rpcName,
    ["bucket", "path"],
  );
  const parsed: SigningSourceUploadCancellation = {
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    cancelled: backendLiteral(result, "cancelled", true, rpcName),
    cleanupStatus: backendEnum(
      result,
      "cleanupStatus",
      CLEANUP_STATUSES,
      rpcName,
    ),
    cleanupTarget: {
      bucket: backendString(cleanupTarget, "bucket", rpcName),
      path: backendString(cleanupTarget, "path", rpcName),
    },
  };

  if (
    parsed.uploadSessionId !== uploadSessionId ||
    parsed.cleanupTarget.bucket !== SIGNING_SOURCE_STORAGE_BUCKET
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningSourceCleanupResult(
  value: unknown,
  uploadSessionId: string,
  expectedStatus: "completed" | "failed",
): SigningSourceCleanupResult {
  const rpcName = SIGNING_SOURCE_RPC.recordCleanup;
  const result = backendObject(value, rpcName, [
    "uploadSessionId",
    "cleanupStatus",
    "cleanupAttemptedAt",
    "cleanupCompletedAt",
    "failureCode",
  ]);
  const parsed: SigningSourceCleanupResult = {
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    cleanupStatus: backendEnum(
      result,
      "cleanupStatus",
      ["completed", "failed"] as const,
      rpcName,
    ),
    cleanupAttemptedAt: backendTimestamp(
      result,
      "cleanupAttemptedAt",
      rpcName,
    ),
    cleanupCompletedAt: backendNullableTimestamp(
      result,
      "cleanupCompletedAt",
      rpcName,
    ),
    failureCode: backendNullableString(result, "failureCode", rpcName),
  };

  if (
    parsed.uploadSessionId !== uploadSessionId ||
    parsed.cleanupStatus !== expectedStatus ||
    (expectedStatus === "completed" &&
      (parsed.cleanupCompletedAt === null || parsed.failureCode !== null)) ||
    (expectedStatus === "failed" && parsed.failureCode === null)
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningSourcePublishResult(
  value: unknown,
  sourceVersionId: string,
): SigningSourcePublishResult {
  const rpcName = SIGNING_SOURCE_RPC.publishVersion;
  const result = backendObject(value, rpcName, [
    "sourceId",
    "sourceVersionId",
    "sourceCode",
    "versionNumber",
    "status",
    "publishedAt",
    "supersededVersionId",
    "idempotent",
  ]);
  const parsed: SigningSourcePublishResult = {
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    sourceCode: backendEnum(
      result,
      "sourceCode",
      SIGNING_SOURCE_CODES,
      rpcName,
    ),
    versionNumber: backendPositiveInteger(result, "versionNumber", rpcName),
    status: backendLiteral(result, "status", "published", rpcName),
    publishedAt: backendTimestamp(result, "publishedAt", rpcName),
    supersededVersionId: backendNullableUuid(
      result,
      "supersededVersionId",
      rpcName,
    ),
    idempotent: backendBoolean(result, "idempotent", rpcName),
  };

  if (parsed.sourceVersionId !== sourceVersionId) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningSourceDownloadTarget(
  value: unknown,
  sourceVersionId: string,
): SigningSourceDownloadTarget {
  const rpcName = SIGNING_SOURCE_RPC.getDownloadTarget;
  const result = backendObject(value, rpcName, [
    "sourceId",
    "sourceVersionId",
    "sourceCode",
    "bucket",
    "path",
    "originalFilename",
    "mimeType",
    "sizeBytes",
    "signedUrlExpiresInSeconds",
  ]);
  const parsed: SigningSourceDownloadTarget = {
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    sourceCode: backendEnum(
      result,
      "sourceCode",
      SIGNING_SOURCE_CODES,
      rpcName,
    ),
    bucket: backendString(result, "bucket", rpcName),
    path: backendString(result, "path", rpcName),
    originalFilename: backendString(result, "originalFilename", rpcName),
    mimeType: backendString(result, "mimeType", rpcName),
    sizeBytes: backendPositiveInteger(result, "sizeBytes", rpcName),
    signedUrlExpiresInSeconds: backendPositiveInteger(
      result,
      "signedUrlExpiresInSeconds",
      rpcName,
    ),
  };

  if (
    parsed.sourceVersionId !== sourceVersionId ||
    parsed.bucket !== SIGNING_SOURCE_STORAGE_BUCKET ||
    parsed.signedUrlExpiresInSeconds > 300
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

export function toPublicSigningSourceFinalization(
  value: SigningSourceUploadFinalization,
): PublicSigningSourceUploadFinalization {
  return {
    sourceId: value.sourceId,
    sourceVersionId: value.sourceVersionId,
    versionNumber: value.versionNumber,
    uploadSessionId: value.uploadSessionId,
    sourceVersionStatus: value.sourceVersionStatus,
    detectedMimeType: value.detectedMimeType,
    sizeBytes: value.sizeBytes,
    finalizedAt: value.finalizedAt,
  };
}
