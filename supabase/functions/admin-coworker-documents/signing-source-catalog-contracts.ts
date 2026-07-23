import {
  GLOBAL_SIGNING_SOURCE_CODES,
  type PublicSigningSourceVersion,
  SIGNING_SOURCE_CODES,
  SIGNING_SOURCE_RPC,
  SIGNING_SOURCE_SHA256_BASE64_PATTERN,
  SIGNING_SOURCE_TYPES,
  SIGNING_SOURCE_VERSION_STATUSES,
  SigningSourceBackendContractError,
  type SigningSourceCatalogItem,
  type SigningSourceDetail,
  signingSourceReaders,
  type SigningSourceRpcName,
  type SigningSourceVersion,
} from "./signing-source-contracts.ts";

const CATALOG_KEYS = [
  "id",
  "sourceType",
  "sourceCode",
  "onboardingCaseId",
  "userId",
  "title",
  "description",
  "currentPublishedVersionId",
  "currentPublishedVersionNumber",
  "currentPublishedAt",
  "latestVersionId",
  "latestVersionNumber",
  "latestVersionStatus",
  "createdAt",
  "updatedAt",
] as const;

const VERSION_KEYS = [
  "id",
  "sourceId",
  "versionNumber",
  "status",
  "originalFilename",
  "storedFilename",
  "fileExtension",
  "declaredMimeType",
  "detectedMimeType",
  "expectedSizeBytes",
  "sizeBytes",
  "contentSha256Base64",
  "uploadedAt",
  "finalizedAt",
  "publishedAt",
  "supersededAt",
  "deletedAt",
  "createdAt",
  "updatedAt",
] as const;

const {
  backendArrayValue,
  backendEnum,
  backendNullableEnum,
  backendNullablePatternString,
  backendNullablePositiveInteger,
  backendNullableString,
  backendNullableTimestamp,
  backendNullableUuid,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = signingSourceReaders;

export function parseSigningSourceCatalog(
  value: unknown,
): SigningSourceCatalogItem[] {
  const rpcName = SIGNING_SOURCE_RPC.getCatalog;
  return backendArrayValue(value, rpcName).map((item) =>
    parseCatalogItem(item, rpcName)
  );
}

export function parseSigningSourceDetail(
  value: unknown,
  sourceId: string,
): SigningSourceDetail {
  const rpcName = SIGNING_SOURCE_RPC.getDetail;
  const result = backendObject(
    value,
    rpcName,
    [...CATALOG_KEYS, "versions"],
  );
  const catalogItem = parseCatalogFields(result, rpcName);
  const versions = backendArrayValue(result.versions, rpcName).map((item) =>
    toPublicVersion(parseVersion(item, rpcName))
  );

  if (
    catalogItem.id !== sourceId ||
    versions.some((version) => version.sourceId !== sourceId)
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return { ...catalogItem, versions };
}

function parseCatalogItem(
  value: unknown,
  rpcName: SigningSourceRpcName,
): SigningSourceCatalogItem {
  return parseCatalogFields(
    backendObject(value, rpcName, CATALOG_KEYS),
    rpcName,
  );
}

function parseCatalogFields(
  result: { [key: string]: unknown },
  rpcName: SigningSourceRpcName,
): SigningSourceCatalogItem {
  const parsed: SigningSourceCatalogItem = {
    id: backendUuid(result, "id", rpcName),
    sourceType: backendEnum(
      result,
      "sourceType",
      SIGNING_SOURCE_TYPES,
      rpcName,
    ),
    sourceCode: backendEnum(
      result,
      "sourceCode",
      SIGNING_SOURCE_CODES,
      rpcName,
    ),
    onboardingCaseId: backendNullableUuid(
      result,
      "onboardingCaseId",
      rpcName,
    ),
    userId: backendNullableUuid(result, "userId", rpcName),
    title: backendString(result, "title", rpcName),
    description: backendNullableString(result, "description", rpcName),
    currentPublishedVersionId: backendNullableUuid(
      result,
      "currentPublishedVersionId",
      rpcName,
    ),
    currentPublishedVersionNumber: backendNullablePositiveInteger(
      result,
      "currentPublishedVersionNumber",
      rpcName,
    ),
    currentPublishedAt: backendNullableTimestamp(
      result,
      "currentPublishedAt",
      rpcName,
    ),
    latestVersionId: backendNullableUuid(
      result,
      "latestVersionId",
      rpcName,
    ),
    latestVersionNumber: backendNullablePositiveInteger(
      result,
      "latestVersionNumber",
      rpcName,
    ),
    latestVersionStatus: backendNullableEnum(
      result,
      "latestVersionStatus",
      SIGNING_SOURCE_VERSION_STATUSES,
      rpcName,
    ),
    createdAt: backendTimestamp(result, "createdAt", rpcName),
    updatedAt: backendTimestamp(result, "updatedAt", rpcName),
  };

  const isGlobal = parsed.sourceType === "global_template";
  if (
    (isGlobal &&
      (parsed.onboardingCaseId !== null ||
        parsed.userId !== null ||
        !GLOBAL_SIGNING_SOURCE_CODES.some(
          (sourceCode) => sourceCode === parsed.sourceCode,
        ))) ||
    (!isGlobal &&
      (parsed.onboardingCaseId === null ||
        parsed.userId === null ||
        parsed.sourceCode !== "mandate_contract"))
  ) {
    throw new SigningSourceBackendContractError(rpcName);
  }
  return parsed;
}

function parseVersion(
  value: unknown,
  rpcName: SigningSourceRpcName,
): SigningSourceVersion {
  const result = backendObject(value, rpcName, VERSION_KEYS);
  return {
    id: backendUuid(result, "id", rpcName),
    sourceId: backendUuid(result, "sourceId", rpcName),
    versionNumber: backendPositiveInteger(
      result,
      "versionNumber",
      rpcName,
    ),
    status: backendEnum(
      result,
      "status",
      SIGNING_SOURCE_VERSION_STATUSES,
      rpcName,
    ),
    originalFilename: backendString(result, "originalFilename", rpcName),
    storedFilename: backendString(result, "storedFilename", rpcName),
    fileExtension: backendString(result, "fileExtension", rpcName),
    declaredMimeType: backendString(result, "declaredMimeType", rpcName),
    detectedMimeType: backendNullableString(
      result,
      "detectedMimeType",
      rpcName,
    ),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      rpcName,
    ),
    sizeBytes: backendNullablePositiveInteger(result, "sizeBytes", rpcName),
    contentSha256Base64: backendNullablePatternString(
      result,
      "contentSha256Base64",
      SIGNING_SOURCE_SHA256_BASE64_PATTERN,
      rpcName,
    ),
    uploadedAt: backendNullableTimestamp(result, "uploadedAt", rpcName),
    finalizedAt: backendNullableTimestamp(result, "finalizedAt", rpcName),
    publishedAt: backendNullableTimestamp(result, "publishedAt", rpcName),
    supersededAt: backendNullableTimestamp(
      result,
      "supersededAt",
      rpcName,
    ),
    deletedAt: backendNullableTimestamp(result, "deletedAt", rpcName),
    createdAt: backendTimestamp(result, "createdAt", rpcName),
    updatedAt: backendTimestamp(result, "updatedAt", rpcName),
  };
}

function toPublicVersion(
  value: SigningSourceVersion,
): PublicSigningSourceVersion {
  return {
    id: value.id,
    sourceId: value.sourceId,
    versionNumber: value.versionNumber,
    status: value.status,
    originalFilename: value.originalFilename,
    storedFilename: value.storedFilename,
    fileExtension: value.fileExtension,
    declaredMimeType: value.declaredMimeType,
    detectedMimeType: value.detectedMimeType,
    expectedSizeBytes: value.expectedSizeBytes,
    sizeBytes: value.sizeBytes,
    uploadedAt: value.uploadedAt,
    finalizedAt: value.finalizedAt,
    publishedAt: value.publishedAt,
    supersededAt: value.supersededAt,
    deletedAt: value.deletedAt,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}
