import {
  type SigningCoworkerSummary,
  type SigningOnboardingCaseSummary,
  type SigningPackage,
  SigningPackageBackendContractError,
  SIGNING_PACKAGE_DOCUMENTS,
  SIGNING_PACKAGE_ITEM_STATUSES,
  type SigningPackageItem,
  type SigningPackageRpcName,
  SIGNING_PACKAGE_STATUSES,
  ONBOARDING_STAGES,
  ONBOARDING_STATUSES,
  signingPackageReaders,
} from "./signing-package-contracts.ts";

const PACKAGE_KEYS = [
  "id",
  "userId",
  "onboardingCaseId",
  "status",
  "issuedAt",
  "submittedAt",
  "reviewStartedAt",
  "needsCorrectionAt",
  "rejectedAt",
  "acceptedAt",
  "rejectionReason",
  "note",
  "revision",
  "items",
  "createdAt",
  "updatedAt",
] as const;

const PACKAGE_ITEM_KEYS = [
  "id",
  "packageId",
  "sequence",
  "documentCode",
  "title",
  "sourceId",
  "sourceVersionId",
  "sourceVersionNumber",
  "requirementId",
  "documentDefinitionId",
  "documentId",
  "currentDocumentVersionId",
  "status",
  "correctionReason",
  "correctionNote",
  "submittedAt",
  "reviewStartedAt",
  "acceptedAt",
  "rejectedAt",
  "createdAt",
  "updatedAt",
] as const;

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
} = signingPackageReaders;

export function parseSigningPackage(
  value: unknown,
  rpcName: SigningPackageRpcName,
): SigningPackage {
  const result = backendObject(value, rpcName, PACKAGE_KEYS);
  const packageId = backendUuid(result, "id", rpcName);
  const items = backendArrayValue(result.items, rpcName);

  if (items.length !== SIGNING_PACKAGE_DOCUMENTS.length) {
    throw new SigningPackageBackendContractError(rpcName);
  }

  const parsed: SigningPackage = {
    id: packageId,
    userId: backendUuid(result, "userId", rpcName),
    onboardingCaseId: backendUuid(result, "onboardingCaseId", rpcName),
    status: backendEnum(
      result,
      "status",
      SIGNING_PACKAGE_STATUSES,
      rpcName,
    ),
    issuedAt: backendTimestamp(result, "issuedAt", rpcName),
    submittedAt: backendNullableTimestamp(
      result,
      "submittedAt",
      rpcName,
    ),
    reviewStartedAt: backendNullableTimestamp(
      result,
      "reviewStartedAt",
      rpcName,
    ),
    needsCorrectionAt: backendNullableTimestamp(
      result,
      "needsCorrectionAt",
      rpcName,
    ),
    rejectedAt: backendNullableTimestamp(result, "rejectedAt", rpcName),
    acceptedAt: backendNullableTimestamp(result, "acceptedAt", rpcName),
    rejectionReason: backendNullableString(
      result,
      "rejectionReason",
      rpcName,
    ),
    note: backendNullableString(result, "note", rpcName),
    revision: backendPositiveInteger(result, "revision", rpcName),
    items: SIGNING_PACKAGE_DOCUMENTS.map((expected, index) =>
      parseSigningPackageItem(
        items[index],
        expected,
        packageId,
        rpcName,
      )
    ),
    createdAt: backendTimestamp(result, "createdAt", rpcName),
    updatedAt: backendTimestamp(result, "updatedAt", rpcName),
  };

  if (new Set(parsed.items.map((item) => item.id)).size !== items.length) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningCoworkerSummary(
  value: unknown,
  rpcName: SigningPackageRpcName,
): SigningCoworkerSummary {
  const result = backendObject(value, rpcName, [
    "userId",
    "displayName",
    "email",
  ]);
  return {
    userId: backendUuid(result, "userId", rpcName),
    displayName: backendString(result, "displayName", rpcName),
    email: backendString(result, "email", rpcName),
  };
}

export function parseSigningOnboardingCaseSummary(
  value: unknown,
  rpcName: SigningPackageRpcName,
): SigningOnboardingCaseSummary {
  const result = backendObject(value, rpcName, [
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
    id: backendUuid(result, "id", rpcName),
    userId: backendUuid(result, "userId", rpcName),
    status: backendEnum(result, "status", ONBOARDING_STATUSES, rpcName),
    stage: backendEnum(result, "stage", ONBOARDING_STAGES, rpcName),
    openedAt: backendTimestamp(result, "openedAt", rpcName),
    submittedAt: backendNullableTimestamp(
      result,
      "submittedAt",
      rpcName,
    ),
    reviewStartedAt: backendNullableTimestamp(
      result,
      "reviewStartedAt",
      rpcName,
    ),
    needsCorrectionAt: backendNullableTimestamp(
      result,
      "needsCorrectionAt",
      rpcName,
    ),
    approvedAt: backendNullableTimestamp(result, "approvedAt", rpcName),
    suspendedAt: backendNullableTimestamp(
      result,
      "suspendedAt",
      rpcName,
    ),
    closedAt: backendNullableTimestamp(result, "closedAt", rpcName),
    revision: backendPositiveInteger(result, "revision", rpcName),
    createdAt: backendTimestamp(result, "createdAt", rpcName),
    updatedAt: backendTimestamp(result, "updatedAt", rpcName),
  };
}

function parseSigningPackageItem(
  value: unknown,
  expected: typeof SIGNING_PACKAGE_DOCUMENTS[number],
  packageId: string,
  rpcName: SigningPackageRpcName,
): SigningPackageItem {
  const result = backendObject(value, rpcName, PACKAGE_ITEM_KEYS);
  const sequence = backendPositiveInteger(result, "sequence", rpcName);
  const documentCode = backendEnum(
    result,
    "documentCode",
    SIGNING_PACKAGE_DOCUMENTS.map((item) => item.documentCode),
    rpcName,
  );

  if (
    sequence !== expected.sequence ||
    documentCode !== expected.documentCode
  ) {
    throw new SigningPackageBackendContractError(rpcName);
  }

  const parsed: SigningPackageItem = {
    id: backendUuid(result, "id", rpcName),
    packageId: backendUuid(result, "packageId", rpcName),
    sequence: expected.sequence,
    documentCode: expected.documentCode,
    title: backendString(result, "title", rpcName),
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    sourceVersionNumber: backendPositiveInteger(
      result,
      "sourceVersionNumber",
      rpcName,
    ),
    requirementId: backendUuid(result, "requirementId", rpcName),
    documentDefinitionId: backendUuid(
      result,
      "documentDefinitionId",
      rpcName,
    ),
    documentId: backendNullableUuid(result, "documentId", rpcName),
    currentDocumentVersionId: backendNullableUuid(
      result,
      "currentDocumentVersionId",
      rpcName,
    ),
    status: backendEnum(
      result,
      "status",
      SIGNING_PACKAGE_ITEM_STATUSES,
      rpcName,
    ),
    correctionReason: backendNullableString(
      result,
      "correctionReason",
      rpcName,
    ),
    correctionNote: backendNullableString(
      result,
      "correctionNote",
      rpcName,
    ),
    submittedAt: backendNullableTimestamp(
      result,
      "submittedAt",
      rpcName,
    ),
    reviewStartedAt: backendNullableTimestamp(
      result,
      "reviewStartedAt",
      rpcName,
    ),
    acceptedAt: backendNullableTimestamp(result, "acceptedAt", rpcName),
    rejectedAt: backendNullableTimestamp(result, "rejectedAt", rpcName),
    createdAt: backendTimestamp(result, "createdAt", rpcName),
    updatedAt: backendTimestamp(result, "updatedAt", rpcName),
  };

  if (parsed.packageId !== packageId) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}
