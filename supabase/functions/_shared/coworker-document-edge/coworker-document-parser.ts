import { createContractReaders } from "./contract-readers.ts";
import {
  COWORKER_DOCUMENT_MALWARE_SCAN_STATUSES,
  COWORKER_DOCUMENT_ORIGINS,
  COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES,
  COWORKER_DOCUMENT_STATUSES,
  COWORKER_DOCUMENT_VERIFICATION_METHODS,
  COWORKER_DOCUMENT_VERIFICATION_STATUSES,
  COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES,
  COWORKER_DOCUMENT_VERSION_STATUSES,
  type CoworkerDocument,
  type CoworkerDocumentSignatureVerification,
  type CoworkerDocumentVersion,
} from "./coworker-document-models.ts";

export * from "./coworker-document-models.ts";

const STATUSES_REQUIRING_SUBMITTED_VERSION = [
  "submitted",
  "under_review",
  "accepted",
  "rejected",
] as const;

const DOCUMENT_KEYS = [
  "id",
  "userId",
  "onboardingCaseId",
  "requirementId",
  "documentDefinitionId",
  "title",
  "origin",
  "status",
  "currentVersionId",
  "currentVersion",
  "submittedVersionId",
  "submittedVersion",
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
  ): CoworkerDocument {
    const source = backendObject(value, context, DOCUMENT_KEYS);
    const documentId = backendUuid(source, "id", context);
    const status = backendEnum(
      source,
      "status",
      COWORKER_DOCUMENT_STATUSES,
      context,
    );
    const currentVersionId = backendNullableUuid(
      source,
      "currentVersionId",
      context,
    );
    const currentVersion = source.currentVersion === null
      ? null
      : parseCoworkerDocumentVersion(
        source.currentVersion,
        documentId,
        context,
      );
    const submittedVersionId = backendNullableUuid(
      source,
      "submittedVersionId",
      context,
    );
    const submittedVersion = source.submittedVersion === null
      ? null
      : parseCoworkerDocumentVersion(
        source.submittedVersion,
        documentId,
        context,
      );
    const versions = backendArrayValue(source.versions, context).map(
      (version) => parseCoworkerDocumentVersion(version, documentId, context),
    );
    const parsed: CoworkerDocument = {
      id: documentId,
      userId: backendUuid(source, "userId", context),
      onboardingCaseId: backendNullableUuid(
        source,
        "onboardingCaseId",
        context,
      ),
      requirementId: backendNullableUuid(source, "requirementId", context),
      documentDefinitionId: backendUuid(
        source,
        "documentDefinitionId",
        context,
      ),
      title: backendNullableString(source, "title", context),
      origin: backendEnum(
        source,
        "origin",
        COWORKER_DOCUMENT_ORIGINS,
        context,
      ),
      status,
      currentVersionId,
      currentVersion,
      submittedVersionId,
      submittedVersion,
      versions,
      submittedAt: backendNullableTimestamp(source, "submittedAt", context),
      reviewStartedAt: backendNullableTimestamp(
        source,
        "reviewStartedAt",
        context,
      ),
      acceptedAt: backendNullableTimestamp(source, "acceptedAt", context),
      rejectedAt: backendNullableTimestamp(source, "rejectedAt", context),
      rejectionReason: backendNullableString(
        source,
        "rejectionReason",
        context,
      ),
      withdrawnAt: backendNullableTimestamp(source, "withdrawnAt", context),
      archivedAt: backendNullableTimestamp(source, "archivedAt", context),
      revision: backendPositiveInteger(source, "revision", context),
      createdAt: backendTimestamp(source, "createdAt", context),
      updatedAt: backendTimestamp(source, "updatedAt", context),
    };

    if (
      (currentVersionId === null) !== (currentVersion === null) ||
      (currentVersion !== null && currentVersion.id !== currentVersionId) ||
      (submittedVersionId === null) !== (submittedVersion === null) ||
      (submittedVersion !== null &&
        submittedVersion.id !== submittedVersionId) ||
      (currentVersionId !== null &&
        !versions.some((version) => version.id === currentVersionId)) ||
      (submittedVersionId !== null &&
        !versions.some((version) => version.id === submittedVersionId)) ||
      (STATUSES_REQUIRING_SUBMITTED_VERSION.some(
        (requiredStatus) => requiredStatus === status,
      ) && submittedVersion === null) ||
      new Set(versions.map((version) => version.id)).size !== versions.length
    ) {
      throw createBackendError(context);
    }
    return parsed;
  }

  function parseCoworkerDocumentVersion(
    value: unknown,
    documentId: string,
    context: Context,
  ): CoworkerDocumentVersion {
    const source = backendObject(value, context, VERSION_KEYS);
    const id = backendUuid(source, "id", context);
    const parsed: CoworkerDocumentVersion = {
      id,
      documentId: backendUuid(source, "documentId", context),
      versionNumber: backendPositiveInteger(
        source,
        "versionNumber",
        context,
      ),
      status: backendEnum(
        source,
        "status",
        COWORKER_DOCUMENT_VERSION_STATUSES,
        context,
      ),
      originalFilename: backendString(source, "originalFilename", context),
      fileExtension: backendString(source, "fileExtension", context),
      declaredMimeType: backendString(source, "declaredMimeType", context),
      detectedMimeType: backendNullableString(
        source,
        "detectedMimeType",
        context,
      ),
      expectedSizeBytes: backendPositiveInteger(
        source,
        "expectedSizeBytes",
        context,
      ),
      sizeBytes: backendNullablePositiveInteger(source, "sizeBytes", context),
      signatureDeclarationType: backendEnum(
        source,
        "signatureDeclarationType",
        COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES,
        context,
      ),
      signatureDeclaredAt: backendNullableTimestamp(
        source,
        "signatureDeclaredAt",
        context,
      ),
      malwareScanStatus: backendEnum(
        source,
        "malwareScanStatus",
        COWORKER_DOCUMENT_MALWARE_SCAN_STATUSES,
        context,
      ),
      uploadedAt: backendNullableTimestamp(source, "uploadedAt", context),
      finalizedAt: backendNullableTimestamp(source, "finalizedAt", context),
      supersededAt: backendNullableTimestamp(
        source,
        "supersededAt",
        context,
      ),
      retentionUntil: backendNullableTimestamp(
        source,
        "retentionUntil",
        context,
      ),
      legalHold: backendBoolean(source, "legalHold", context),
      latestSignatureVerification: source.latestSignatureVerification === null
        ? null
        : parseVerification(source.latestSignatureVerification, context),
      createdAt: backendTimestamp(source, "createdAt", context),
      updatedAt: backendTimestamp(source, "updatedAt", context),
    };

    if (parsed.documentId !== documentId) {
      throw createBackendError(context);
    }
    return parsed;
  }

  function parseVerification(
    value: unknown,
    context: Context,
  ): CoworkerDocumentSignatureVerification {
    const source = backendObject(value, context, VERIFICATION_KEYS);
    return {
      id: backendUuid(source, "id", context),
      verificationMethod: backendEnum(
        source,
        "verificationMethod",
        COWORKER_DOCUMENT_VERIFICATION_METHODS,
        context,
      ),
      verificationStatus: backendEnum(
        source,
        "verificationStatus",
        COWORKER_DOCUMENT_VERIFICATION_STATUSES,
        context,
      ),
      signatureType: backendEnum(
        source,
        "signatureType",
        COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES,
        context,
      ),
      reason: backendNullableString(source, "reason", context),
      createdAt: backendTimestamp(source, "createdAt", context),
    };
  }

  return { parseCoworkerDocument, parseCoworkerDocumentVersion };
}
