import { createCoworkerDocumentParser } from "./coworker-document-parser.ts";
import { createContractReaders } from "./contract-readers.ts";
import { createSigningPackageItemMetadataParsers } from "./signing-package-item-metadata-parser.ts";
import {
  SIGNING_PACKAGE_ITEM_STATUSES,
  SIGNING_PACKAGE_REASONS,
  SIGNING_PACKAGE_STATUSES,
  type SigningPackage,
  type SigningPackageItem,
  type SigningPackageSummary,
} from "./signing-package-models.ts";

const PACKAGE_KEYS = [
  "id",
  "userId",
  "onboardingCaseId",
  "reason",
  "status",
  "revision",
  "issuedAt",
  "reviewStartedAt",
  "approvedAt",
  "rejectedAt",
  "rejectionReason",
  "cancelledAt",
  "cancellationReason",
  "items",
  "summary",
  "createdAt",
  "updatedAt",
] as const;

const PACKAGE_ITEM_KEYS = [
  "id",
  "packageId",
  "status",
  "documentDefinition",
  "requirement",
  "source",
  "signedDocumentId",
  "signedDocumentVersionId",
  "signedDocument",
  "submittedAt",
  "reviewStartedAt",
  "acceptedAt",
  "rejectedAt",
  "rejectionReason",
  "canUpload",
  "canSubmit",
  "createdAt",
  "updatedAt",
] as const;

const ITEM_STATUSES_REQUIRING_SUBMITTED_VERSION = [
  "submitted",
  "under_review",
  "needs_correction",
  "accepted",
  "rejected",
] as const;

const SUMMARY_KEYS = [
  "total",
  "awaitingSignature",
  "submitted",
  "underReview",
  "needsCorrection",
  "accepted",
  "rejected",
] as const;

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

export function createSigningPackageModelParsers<Context>(
  readers: ContractReaders<Context>,
  createBackendError: (context: Context) => Error,
) {
  const {
    backendArrayValue,
    backendBoolean,
    backendEnum,
    backendNonNegativeInteger,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendPositiveInteger,
    backendTimestamp,
    backendUuid,
  } = readers;
  const { parseCoworkerDocument } = createCoworkerDocumentParser(
    readers,
    createBackendError,
  );
  const { parseDocumentDefinition, parseRequirement, parseSource } =
    createSigningPackageItemMetadataParsers(readers);

  function parseSigningPackage(
    value: unknown,
    context: Context,
  ): SigningPackage {
    const result = backendObject(value, context, PACKAGE_KEYS);
    const packageId = backendUuid(result, "id", context);
    const items = backendArrayValue(result.items, context).map((item) =>
      parseSigningPackageItem(item, context, packageId)
    );
    const parsed: SigningPackage = {
      id: packageId,
      userId: backendUuid(result, "userId", context),
      onboardingCaseId: backendNullableUuid(
        result,
        "onboardingCaseId",
        context,
      ),
      reason: backendEnum(
        result,
        "reason",
        SIGNING_PACKAGE_REASONS,
        context,
      ),
      status: backendEnum(
        result,
        "status",
        SIGNING_PACKAGE_STATUSES,
        context,
      ),
      revision: backendPositiveInteger(result, "revision", context),
      issuedAt: backendNullableTimestamp(result, "issuedAt", context),
      reviewStartedAt: backendNullableTimestamp(
        result,
        "reviewStartedAt",
        context,
      ),
      approvedAt: backendNullableTimestamp(result, "approvedAt", context),
      rejectedAt: backendNullableTimestamp(result, "rejectedAt", context),
      rejectionReason: backendNullableString(
        result,
        "rejectionReason",
        context,
      ),
      cancelledAt: backendNullableTimestamp(result, "cancelledAt", context),
      cancellationReason: backendNullableString(
        result,
        "cancellationReason",
        context,
      ),
      items,
      summary: parseSummary(result.summary, context),
      createdAt: backendTimestamp(result, "createdAt", context),
      updatedAt: backendTimestamp(result, "updatedAt", context),
    };

    if (new Set(items.map((item) => item.id)).size !== items.length) {
      throw createBackendError(context);
    }
    return parsed;
  }

  function parseSigningPackageItem(
    value: unknown,
    context: Context,
    expectedPackageId?: string,
  ): SigningPackageItem {
    const result = backendObject(value, context, PACKAGE_ITEM_KEYS);
    const packageId = backendUuid(result, "packageId", context);
    const signedDocumentId = backendNullableUuid(
      result,
      "signedDocumentId",
      context,
    );
    const signedDocumentVersionId = backendNullableUuid(
      result,
      "signedDocumentVersionId",
      context,
    );
    const signedDocument = result.signedDocument === null
      ? null
      : parseCoworkerDocument(result.signedDocument, context);
    const status = backendEnum(
      result,
      "status",
      SIGNING_PACKAGE_ITEM_STATUSES,
      context,
    );
    const parsed: SigningPackageItem = {
      id: backendUuid(result, "id", context),
      packageId,
      status,
      documentDefinition: parseDocumentDefinition(
        result.documentDefinition,
        context,
      ),
      requirement: parseRequirement(result.requirement, context),
      source: parseSource(result.source, context),
      signedDocumentId,
      signedDocumentVersionId,
      signedDocument,
      submittedAt: backendNullableTimestamp(result, "submittedAt", context),
      reviewStartedAt: backendNullableTimestamp(
        result,
        "reviewStartedAt",
        context,
      ),
      acceptedAt: backendNullableTimestamp(result, "acceptedAt", context),
      rejectedAt: backendNullableTimestamp(result, "rejectedAt", context),
      rejectionReason: backendNullableString(
        result,
        "rejectionReason",
        context,
      ),
      canUpload: backendBoolean(result, "canUpload", context),
      canSubmit: backendBoolean(result, "canSubmit", context),
      createdAt: backendTimestamp(result, "createdAt", context),
      updatedAt: backendTimestamp(result, "updatedAt", context),
    };

    const hasSignedDocument = signedDocument !== null;
    if (
      (expectedPackageId !== undefined && packageId !== expectedPackageId) ||
      (signedDocumentId !== null) !== hasSignedDocument ||
      (signedDocumentVersionId !== null) !== hasSignedDocument ||
      (signedDocument !== null &&
        (signedDocument.id !== signedDocumentId ||
          signedDocument.origin !== "coworker_upload")) ||
      (ITEM_STATUSES_REQUIRING_SUBMITTED_VERSION.some(
        (requiredStatus) => requiredStatus === status,
      ) &&
        (signedDocument === null ||
          signedDocument.submittedVersionId !== signedDocumentVersionId ||
          signedDocument.submittedVersion?.id !== signedDocumentVersionId))
    ) {
      throw createBackendError(context);
    }
    return parsed;
  }

  function parseSummary(
    value: unknown,
    context: Context,
  ): SigningPackageSummary {
    const result = backendObject(value, context, SUMMARY_KEYS);
    return {
      total: backendNonNegativeInteger(result, "total", context),
      awaitingSignature: backendNonNegativeInteger(
        result,
        "awaitingSignature",
        context,
      ),
      submitted: backendNonNegativeInteger(result, "submitted", context),
      underReview: backendNonNegativeInteger(result, "underReview", context),
      needsCorrection: backendNonNegativeInteger(
        result,
        "needsCorrection",
        context,
      ),
      accepted: backendNonNegativeInteger(result, "accepted", context),
      rejected: backendNonNegativeInteger(result, "rejected", context),
    };
  }

  return { parseSigningPackage, parseSigningPackageItem };
}
