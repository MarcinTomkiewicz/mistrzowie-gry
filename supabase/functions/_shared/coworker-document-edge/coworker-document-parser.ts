import { createContractReaders } from "./contract-readers.ts";
import type { UnknownObject } from "./contract-reader-foundation.ts";

export const COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES = [
  "unsigned",
  "handwritten",
  "trusted_profile",
  "qualified_electronic",
  "other_electronic",
  "unknown",
] as const;

const DOCUMENT_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
] as const;
const VERSION_STATUSES = [
  "reserved",
  "uploaded",
  "ready",
  "blocked",
  "failed",
  "superseded",
  "deleted",
] as const;
const MALWARE_SCAN_STATUSES = [
  "not_scanned",
  "pending",
  "clean",
  "infected",
  "failed",
  "unavailable",
] as const;
const VERIFICATION_METHODS = [
  "manual",
  "automatic",
  "external_provider",
] as const;
const VERIFICATION_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "indeterminate",
  "unsupported",
] as const;
const VERIFIED_SIGNATURE_TYPES = [
  "handwritten",
  "trusted_profile",
  "qualified_electronic",
  "other_electronic",
  "unknown",
] as const;

const DOCUMENT_KEYS = [
  "id",
  "userId",
  "onboardingCaseId",
  "requirementId",
  "documentDefinitionId",
  "title",
  "status",
  "currentVersionId",
  "currentVersion",
  "versions",
  "submittedAt",
  "reviewStartedAt",
  "acceptedAt",
  "rejectedAt",
  "rejectionReason",
  "withdrawnAt",
  "archivedAt",
  "revision",
  "createdAt",
  "updatedAt",
] as const;
const VERSION_KEYS = [
  "id",
  "documentId",
  "versionNumber",
  "status",
  "originalFilename",
  "fileExtension",
  "declaredMimeType",
  "detectedMimeType",
  "expectedSizeBytes",
  "sizeBytes",
  "signatureDeclarationType",
  "signatureDeclaredAt",
  "malwareScanStatus",
  "uploadedAt",
  "finalizedAt",
  "supersededAt",
  "retentionUntil",
  "legalHold",
  "latestSignatureVerification",
  "createdAt",
  "updatedAt",
] as const;
const VERIFICATION_KEYS = [
  "id",
  "verificationMethod",
  "verificationStatus",
  "signatureType",
  "reason",
  "createdAt",
] as const;

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

export function createCoworkerDocumentParser<Context>(
  readers: ContractReaders<Context>,
  createBackendError: (context: Context) => Error,
) {
  const {
    backendArrayValue,
    backendBoolean,
    backendEnum,
    backendNullablePositiveInteger,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendPositiveInteger,
    backendString,
    backendTimestamp,
    backendUuid,
  } = readers;

  function parseCoworkerDocument(
    value: unknown,
    context: Context,
  ): UnknownObject {
    const source = backendObject(value, context, DOCUMENT_KEYS);
    const documentId = backendUuid(source, "id", context);
    backendUuid(source, "userId", context);
    backendNullableUuid(source, "onboardingCaseId", context);
    backendNullableUuid(source, "requirementId", context);
    backendUuid(source, "documentDefinitionId", context);
    backendNullableString(source, "title", context);
    backendEnum(source, "status", DOCUMENT_STATUSES, context);
    const currentVersionId = backendNullableUuid(
      source,
      "currentVersionId",
      context,
    );
    const currentVersion = source.currentVersion === null
      ? null
      : parseVersion(source.currentVersion, documentId, context);
    const versions = backendArrayValue(source.versions, context).map(
      (version) => parseVersion(version, documentId, context),
    );
    backendNullableTimestamp(source, "submittedAt", context);
    backendNullableTimestamp(source, "reviewStartedAt", context);
    backendNullableTimestamp(source, "acceptedAt", context);
    backendNullableTimestamp(source, "rejectedAt", context);
    backendNullableString(source, "rejectionReason", context);
    backendNullableTimestamp(source, "withdrawnAt", context);
    backendNullableTimestamp(source, "archivedAt", context);
    backendPositiveInteger(source, "revision", context);
    backendTimestamp(source, "createdAt", context);
    backendTimestamp(source, "updatedAt", context);

    if (
      (currentVersionId === null) !== (currentVersion === null) ||
      (currentVersion !== null && currentVersion.id !== currentVersionId) ||
      (currentVersionId !== null &&
        !versions.some((version) => version.id === currentVersionId)) ||
      new Set(versions.map((version) => version.id)).size !== versions.length
    ) {
      throw createBackendError(context);
    }
    return source;
  }

  function parseVersion(
    value: unknown,
    documentId: string,
    context: Context,
  ): { id: string } {
    const source = backendObject(value, context, VERSION_KEYS);
    const id = backendUuid(source, "id", context);
    if (backendUuid(source, "documentId", context) !== documentId) {
      throw createBackendError(context);
    }
    backendPositiveInteger(source, "versionNumber", context);
    backendEnum(source, "status", VERSION_STATUSES, context);
    backendString(source, "originalFilename", context);
    backendString(source, "fileExtension", context);
    backendString(source, "declaredMimeType", context);
    backendNullableString(source, "detectedMimeType", context);
    backendPositiveInteger(source, "expectedSizeBytes", context);
    backendNullablePositiveInteger(source, "sizeBytes", context);
    backendEnum(
      source,
      "signatureDeclarationType",
      COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES,
      context,
    );
    backendNullableTimestamp(source, "signatureDeclaredAt", context);
    backendEnum(source, "malwareScanStatus", MALWARE_SCAN_STATUSES, context);
    backendNullableTimestamp(source, "uploadedAt", context);
    backendNullableTimestamp(source, "finalizedAt", context);
    backendNullableTimestamp(source, "supersededAt", context);
    backendNullableTimestamp(source, "retentionUntil", context);
    backendBoolean(source, "legalHold", context);
    if (source.latestSignatureVerification !== null) {
      parseVerification(source.latestSignatureVerification, context);
    }
    backendTimestamp(source, "createdAt", context);
    backendTimestamp(source, "updatedAt", context);
    return { id };
  }

  function parseVerification(value: unknown, context: Context): void {
    const source = backendObject(value, context, VERIFICATION_KEYS);
    backendUuid(source, "id", context);
    backendEnum(source, "verificationMethod", VERIFICATION_METHODS, context);
    backendEnum(source, "verificationStatus", VERIFICATION_STATUSES, context);
    backendEnum(source, "signatureType", VERIFIED_SIGNATURE_TYPES, context);
    backendNullableString(source, "reason", context);
    backendTimestamp(source, "createdAt", context);
  }

  return { parseCoworkerDocument };
}
