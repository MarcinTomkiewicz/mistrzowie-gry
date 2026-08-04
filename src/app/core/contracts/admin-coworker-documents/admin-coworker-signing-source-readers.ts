import {
  IAdminCoworkerSigningSourceCatalogItem,
  IAdminCoworkerSigningSourceDetail,
  IAdminCoworkerSigningSourceSignedUpload,
  IAdminCoworkerSigningSourceVersion,
} from '../../interfaces/i-admin-coworker-signing-source';
import {
  ADMIN_COWORKER_GLOBAL_SIGNING_SOURCE_CODES,
  ADMIN_COWORKER_SIGNING_SOURCE_CODES,
  ADMIN_COWORKER_SIGNING_SOURCE_TYPES,
  ADMIN_COWORKER_SIGNING_SOURCE_VERSION_STATUSES,
} from '../../types/admin-coworker-signing-source';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeNonBlankString,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

export const nullableSigningSourceUuidReader =
  createEdgeNullableReader(readEdgeUuid);
const nullablePositiveIntegerReader =
  createEdgeNullableReader(readEdgePositiveInteger);
export const signingSourceCodeReader = createEdgeLiteralReader(
  ADMIN_COWORKER_SIGNING_SOURCE_CODES,
);
const signingSourceVersionStatusReader = createEdgeLiteralReader(
  ADMIN_COWORKER_SIGNING_SOURCE_VERSION_STATUSES,
);

const catalogFieldReaders = {
  id: readEdgeUuid,
  sourceType: createEdgeLiteralReader(ADMIN_COWORKER_SIGNING_SOURCE_TYPES),
  sourceCode: signingSourceCodeReader,
  onboardingCaseId: nullableSigningSourceUuidReader,
  userId: nullableSigningSourceUuidReader,
  title: readEdgeNonBlankString,
  description: readEdgeNullableString,
  currentPublishedVersionId: nullableSigningSourceUuidReader,
  currentPublishedVersionNumber: nullablePositiveIntegerReader,
  currentPublishedAt: readEdgeNullableTimestamp,
  latestVersionId: nullableSigningSourceUuidReader,
  latestVersionNumber: nullablePositiveIntegerReader,
  latestVersionStatus: createEdgeNullableReader(
    signingSourceVersionStatusReader,
  ),
  createdAt: readEdgeTimestamp,
  updatedAt: readEdgeTimestamp,
} as const;

const catalogItemShapeReader = createStrictEdgeObjectReader(
  catalogFieldReaders,
);

export const signingSourceCatalogItemReader:
  EdgeReader<IAdminCoworkerSigningSourceCatalogItem> = (value, path) => {
    const item = catalogItemShapeReader(value, path);
    assertCatalogItem(item, path);
    return item;
  };

export const signingSourceVersionReader:
  EdgeReader<IAdminCoworkerSigningSourceVersion> = (value, path) => {
    const version = createStrictEdgeObjectReader({
      id: readEdgeUuid,
      sourceId: readEdgeUuid,
      versionNumber: readEdgePositiveInteger,
      status: signingSourceVersionStatusReader,
      originalFilename: readEdgeNonBlankString,
      storedFilename: readEdgeNonBlankString,
      fileExtension: readEdgeNonBlankString,
      declaredMimeType: readEdgeNonBlankString,
      detectedMimeType: readEdgeNullableString,
      expectedSizeBytes: readEdgePositiveInteger,
      sizeBytes: nullablePositiveIntegerReader,
      uploadedAt: readEdgeNullableTimestamp,
      finalizedAt: readEdgeNullableTimestamp,
      publishedAt: readEdgeNullableTimestamp,
      supersededAt: readEdgeNullableTimestamp,
      deletedAt: readEdgeNullableTimestamp,
      createdAt: readEdgeTimestamp,
      updatedAt: readEdgeTimestamp,
    })(value, path);

    assertVersionLifecycle(version, path);
    return version;
  };

export const signingSourceSignedUploadReader:
  EdgeReader<IAdminCoworkerSigningSourceSignedUpload> =
  createStrictEdgeObjectReader({
    token: readEdgeNonBlankString,
    signedUrl: readSigningSourceUrl,
    expiresAt: readEdgeTimestamp,
  });

export function createSigningSourceValueReader(
  sourceId: string,
): EdgeReader<IAdminCoworkerSigningSourceDetail> {
  return (value, path) => {
    const source = createStrictEdgeObjectReader({
      ...catalogFieldReaders,
      versions: createEdgeArrayReader(signingSourceVersionReader),
    })(value, path);
    assertCatalogItem(source, path);
    assertSourceVersions(source, sourceId, path);
    return source;
  };
}

export function readSigningSourceUrl(value: unknown, path: string): string {
  const parsed = readEdgeNonBlankString(value, path);
  let valid = false;
  try {
    const url = new URL(parsed);
    valid = url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    valid = false;
  }
  assertEdgeContract(valid, path, 'an HTTP or HTTPS URL');
  return parsed;
}

export function assertSigningSourceSignedUpload(
  signedUpload: IAdminCoworkerSigningSourceSignedUpload,
  path: string,
): void {
  const token = new URL(signedUpload.signedUrl).searchParams.get('token');
  assertEdgeContract(
    token === signedUpload.token,
    path,
    'a signed URL containing the returned upload token',
  );
}

function assertCatalogItem(
  item: IAdminCoworkerSigningSourceCatalogItem,
  path: string,
): void {
  const global = item.sourceType === 'global_template';
  const currentPublishedFields = [
    item.currentPublishedVersionId,
    item.currentPublishedVersionNumber,
    item.currentPublishedAt,
  ];
  const latestVersionFields = [
    item.latestVersionId,
    item.latestVersionNumber,
    item.latestVersionStatus,
  ];

  assertEdgeContract(
    (global && item.onboardingCaseId === null && item.userId === null &&
      ADMIN_COWORKER_GLOBAL_SIGNING_SOURCE_CODES.some(
        (code) => code === item.sourceCode,
      )) ||
      (!global && item.onboardingCaseId !== null && item.userId !== null &&
        item.sourceCode === 'mandate_contract'),
    path,
    'a consistent signing source type, code and owner',
  );
  assertEdgeContract(
    hasConsistentNullableFields(currentPublishedFields) &&
      hasConsistentNullableFields(latestVersionFields),
    path,
    'consistent current published and latest version fields',
  );
}

function assertSourceVersions(
  source: IAdminCoworkerSigningSourceDetail,
  sourceId: string,
  path: string,
): void {
  const versions = source.versions;
  const current = versions.find(
    (version) => version.id === source.currentPublishedVersionId,
  );
  const latest = versions.find((version) => version.id === source.latestVersionId);
  const highestVersionNumber = versions.reduce(
    (highest, version) => Math.max(highest, version.versionNumber),
    0,
  );

  assertEdgeContract(
    source.id === sourceId &&
      versions.every((version) => version.sourceId === sourceId) &&
      new Set(versions.map((version) => version.id)).size === versions.length &&
      new Set(versions.map((version) => version.versionNumber)).size ===
        versions.length,
    `${path}.versions`,
    'unique versions belonging to the requested source',
  );
  assertEdgeContract(
    (source.currentPublishedVersionId === null && current === undefined) ||
      (current?.status === 'published' &&
        current.versionNumber === source.currentPublishedVersionNumber &&
        current.publishedAt === source.currentPublishedAt),
    `${path}.currentPublishedVersionId`,
    'the referenced current published version',
  );
  assertEdgeContract(
    (source.latestVersionId === null && versions.length === 0) ||
      (latest !== undefined &&
        latest.versionNumber === source.latestVersionNumber &&
        latest.status === source.latestVersionStatus &&
        latest.versionNumber === highestVersionNumber),
    `${path}.latestVersionId`,
    'the referenced latest version',
  );
}

function assertVersionLifecycle(
  version: IAdminCoworkerSigningSourceVersion,
  path: string,
): void {
  const finalized = version.finalizedAt !== null &&
    version.detectedMimeType !== null && version.sizeBytes !== null;
  const valid =
    (version.status === 'reserved' && version.uploadedAt === null &&
      !finalized && version.publishedAt === null &&
      version.supersededAt === null && version.deletedAt === null) ||
    (version.status === 'uploaded' && version.uploadedAt !== null &&
      !finalized && version.publishedAt === null &&
      version.supersededAt === null && version.deletedAt === null) ||
    (version.status === 'ready' && finalized &&
      version.publishedAt === null && version.supersededAt === null &&
      version.deletedAt === null) ||
    (version.status === 'published' && finalized &&
      version.publishedAt !== null && version.supersededAt === null &&
      version.deletedAt === null) ||
    (version.status === 'superseded' && finalized &&
      version.publishedAt !== null && version.supersededAt !== null &&
      version.deletedAt === null) ||
    (version.status === 'deleted' && version.deletedAt !== null);

  assertEdgeContract(valid, path, 'a consistent signing source version lifecycle');
}

function hasConsistentNullableFields(values: readonly unknown[]): boolean {
  return values.every((value) => value === null) ||
    values.every((value) => value !== null);
}
