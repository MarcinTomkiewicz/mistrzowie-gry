import { createContractReaders } from "./contract-readers.ts";
import {
  ONBOARDING_STAGES,
  ONBOARDING_STATUSES,
  type SigningCoworkerSummary,
  type SigningOnboardingCaseSummary,
  type SigningPackage,
  SIGNING_PACKAGE_DOCUMENTS,
  type SigningPackageItem,
  SIGNING_PACKAGE_ITEM_STATUSES,
  SIGNING_PACKAGE_STATUSES,
} from "./signing-package-models.ts";

const PACKAGE_KEYS = [
  "id", "userId", "onboardingCaseId", "status",
  "issuedAt", "submittedAt", "reviewStartedAt", "needsCorrectionAt",
  "rejectedAt", "acceptedAt", "rejectionReason", "note",
  "revision", "items", "createdAt", "updatedAt",
] as const;

const PACKAGE_ITEM_KEYS = [
  "id", "packageId", "sequence", "documentCode",
  "title", "sourceId", "sourceVersionId", "sourceVersionNumber",
  "requirementId", "documentDefinitionId", "documentId",
  "currentDocumentVersionId", "status", "correctionReason",
  "correctionNote", "submittedAt", "reviewStartedAt", "acceptedAt",
  "rejectedAt", "createdAt", "updatedAt",
] as const;

type ContractReaders<Context> =
  ReturnType<typeof createContractReaders<Context>>;

export function createSigningPackageModelParsers<Context>(
  readers: ContractReaders<Context>,
  createBackendError: (context: Context) => Error,
) {
  const {
    backendArrayValue,
    backendEnum,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendPositiveInteger,
    backendString,
    backendTimestamp,
    backendUuid,
  } = readers;

  function parseSigningPackage(
    value: unknown,
    context: Context,
  ): SigningPackage {
    const result = backendObject(value, context, PACKAGE_KEYS);
    const packageId = backendUuid(result, "id", context);
    const items = backendArrayValue(result.items, context);

    if (items.length !== SIGNING_PACKAGE_DOCUMENTS.length) {
      throw createBackendError(context);
    }

    const parsed: SigningPackage = {
      id: packageId,
      userId: backendUuid(result, "userId", context),
      onboardingCaseId: backendUuid(result, "onboardingCaseId", context),
      status: backendEnum(
        result,
        "status",
        SIGNING_PACKAGE_STATUSES,
        context,
      ),
      issuedAt: backendTimestamp(result, "issuedAt", context),
      submittedAt: backendNullableTimestamp(
        result,
        "submittedAt",
        context,
      ),
      reviewStartedAt: backendNullableTimestamp(
        result,
        "reviewStartedAt",
        context,
      ),
      needsCorrectionAt: backendNullableTimestamp(
        result,
        "needsCorrectionAt",
        context,
      ),
      rejectedAt: backendNullableTimestamp(result, "rejectedAt", context),
      acceptedAt: backendNullableTimestamp(result, "acceptedAt", context),
      rejectionReason: backendNullableString(
        result,
        "rejectionReason",
        context,
      ),
      note: backendNullableString(result, "note", context),
      revision: backendPositiveInteger(result, "revision", context),
      items: SIGNING_PACKAGE_DOCUMENTS.map((expected, index) =>
        parseSigningPackageItem(
          items[index],
          expected,
          packageId,
          context,
        )
      ),
      createdAt: backendTimestamp(result, "createdAt", context),
      updatedAt: backendTimestamp(result, "updatedAt", context),
    };

    if (
      new Set(parsed.items.map((item) => item.id)).size !== items.length
    ) {
      throw createBackendError(context);
    }
    return parsed;
  }

  function parseSigningCoworkerSummary(
    value: unknown,
    context: Context,
  ): SigningCoworkerSummary {
    const result = backendObject(value, context, [
      "userId",
      "displayName",
      "email",
    ]);
    return {
      userId: backendUuid(result, "userId", context),
      displayName: backendString(result, "displayName", context),
      email: backendString(result, "email", context),
    };
  }

  function parseSigningOnboardingCaseSummary(
    value: unknown,
    context: Context,
  ): SigningOnboardingCaseSummary {
    const result = backendObject(value, context, [
      "id",
      "userId",
      "status",
      "stage",
      "openedAt",
      "submittedAt",
      "reviewStartedAt",
      "needsCorrectionAt",
      "approvedAt",
      "suspendedAt",
      "closedAt",
      "revision",
      "createdAt",
      "updatedAt",
    ]);
    return {
      id: backendUuid(result, "id", context),
      userId: backendUuid(result, "userId", context),
      status: backendEnum(result, "status", ONBOARDING_STATUSES, context),
      stage: backendEnum(result, "stage", ONBOARDING_STAGES, context),
      openedAt: backendTimestamp(result, "openedAt", context),
      submittedAt: backendNullableTimestamp(
        result,
        "submittedAt",
        context,
      ),
      reviewStartedAt: backendNullableTimestamp(
        result,
        "reviewStartedAt",
        context,
      ),
      needsCorrectionAt: backendNullableTimestamp(
        result,
        "needsCorrectionAt",
        context,
      ),
      approvedAt: backendNullableTimestamp(result, "approvedAt", context),
      suspendedAt: backendNullableTimestamp(
        result,
        "suspendedAt",
        context,
      ),
      closedAt: backendNullableTimestamp(result, "closedAt", context),
      revision: backendPositiveInteger(result, "revision", context),
      createdAt: backendTimestamp(result, "createdAt", context),
      updatedAt: backendTimestamp(result, "updatedAt", context),
    };
  }

  function parseSigningPackageItem(
    value: unknown,
    expected: typeof SIGNING_PACKAGE_DOCUMENTS[number],
    packageId: string,
    context: Context,
  ): SigningPackageItem {
    const result = backendObject(value, context, PACKAGE_ITEM_KEYS);
    const sequence = backendPositiveInteger(result, "sequence", context);
    const documentCode = backendEnum(
      result,
      "documentCode",
      SIGNING_PACKAGE_DOCUMENTS.map((item) => item.documentCode),
      context,
    );

    if (
      sequence !== expected.sequence ||
      documentCode !== expected.documentCode
    ) {
      throw createBackendError(context);
    }

    const parsed: SigningPackageItem = {
      id: backendUuid(result, "id", context),
      packageId: backendUuid(result, "packageId", context),
      sequence: expected.sequence,
      documentCode: expected.documentCode,
      title: backendString(result, "title", context),
      sourceId: backendUuid(result, "sourceId", context),
      sourceVersionId: backendUuid(result, "sourceVersionId", context),
      sourceVersionNumber: backendPositiveInteger(
        result,
        "sourceVersionNumber",
        context,
      ),
      requirementId: backendUuid(result, "requirementId", context),
      documentDefinitionId: backendUuid(
        result,
        "documentDefinitionId",
        context,
      ),
      documentId: backendNullableUuid(result, "documentId", context),
      currentDocumentVersionId: backendNullableUuid(
        result,
        "currentDocumentVersionId",
        context,
      ),
      status: backendEnum(
        result,
        "status",
        SIGNING_PACKAGE_ITEM_STATUSES,
        context,
      ),
      correctionReason: backendNullableString(
        result,
        "correctionReason",
        context,
      ),
      correctionNote: backendNullableString(
        result,
        "correctionNote",
        context,
      ),
      submittedAt: backendNullableTimestamp(
        result,
        "submittedAt",
        context,
      ),
      reviewStartedAt: backendNullableTimestamp(
        result,
        "reviewStartedAt",
        context,
      ),
      acceptedAt: backendNullableTimestamp(result, "acceptedAt", context),
      rejectedAt: backendNullableTimestamp(result, "rejectedAt", context),
      createdAt: backendTimestamp(result, "createdAt", context),
      updatedAt: backendTimestamp(result, "updatedAt", context),
    };

    if (parsed.packageId !== packageId) {
      throw createBackendError(context);
    }
    return parsed;
  }

  return {
    parseSigningCoworkerSummary,
    parseSigningOnboardingCaseSummary,
    parseSigningPackage,
  };
}
