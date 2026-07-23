import {
  type AdminSigningPackageDetail,
  type AdminSigningPackageListItem,
  type ExternalDeliveryResult,
  type IssueSigningPackageResult,
  SIGNING_PACKAGE_RPC,
  SIGNING_PACKAGE_STATUSES,
  SigningPackageBackendContractError,
  signingPackageReaders,
  type SigningPackageRpcName,
} from "./signing-package-contracts.ts";
import {
  parseSigningCoworkerSummary,
  parseSigningOnboardingCaseSummary,
  parseSigningPackage,
} from "./signing-package-model-contracts.ts";

const LIST_ITEM_KEYS = [
  "id",
  "userId",
  "onboardingCaseId",
  "coworker",
  "status",
  "itemCount",
  "pendingItemCount",
  "submittedItemCount",
  "needsCorrectionItemCount",
  "acceptedItemCount",
  "issuedAt",
  "submittedAt",
  "reviewStartedAt",
  "acceptedAt",
  "rejectedAt",
  "revision",
  "updatedAt",
] as const;

const {
  backendArrayValue,
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendNonNegativeInteger,
  backendNullableString,
  backendNullableTimestamp,
  backendObject,
  backendPositiveInteger,
  backendTimestamp,
  backendUuid,
} = signingPackageReaders;

export interface ExternalDeliveryExpectation {
  userId: string;
  onboardingCaseId: string;
  documentId: string;
  documentVersionId: string;
}

export function parseExternalDeliveryResult(
  value: unknown,
  expected: ExternalDeliveryExpectation,
): ExternalDeliveryResult {
  const rpcName = SIGNING_PACKAGE_RPC.recordQuestionnaireDelivery;
  const result = backendObject(value, rpcName, ["created", "delivery"]);
  const delivery = backendObject(result.delivery, rpcName, [
    "id",
    "userId",
    "onboardingCaseId",
    "documentId",
    "documentVersionId",
    "destination",
    "deliveryType",
    "note",
    "deliveredBy",
    "deliveredAt",
    "createdAt",
  ]);
  const parsed: ExternalDeliveryResult = {
    created: backendBoolean(result, "created", rpcName),
    delivery: {
      id: backendUuid(delivery, "id", rpcName),
      userId: backendUuid(delivery, "userId", rpcName),
      onboardingCaseId: backendUuid(
        delivery,
        "onboardingCaseId",
        rpcName,
      ),
      documentId: backendUuid(delivery, "documentId", rpcName),
      documentVersionId: backendUuid(
        delivery,
        "documentVersionId",
        rpcName,
      ),
      destination: backendLiteral(
        delivery,
        "destination",
        "accounting",
        rpcName,
      ),
      deliveryType: backendLiteral(
        delivery,
        "deliveryType",
        "onboarding_questionnaire",
        rpcName,
      ),
      note: backendNullableString(delivery, "note", rpcName),
      deliveredBy: backendUuid(delivery, "deliveredBy", rpcName),
      deliveredAt: backendTimestamp(delivery, "deliveredAt", rpcName),
      createdAt: backendTimestamp(delivery, "createdAt", rpcName),
    },
  };

  if (
    parsed.delivery.userId !== expected.userId ||
    parsed.delivery.onboardingCaseId !== expected.onboardingCaseId ||
    parsed.delivery.documentId !== expected.documentId ||
    parsed.delivery.documentVersionId !== expected.documentVersionId
  ) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}

export function parseIssueSigningPackageResult(
  value: unknown,
  userId: string,
  onboardingCaseId: string,
): IssueSigningPackageResult {
  const rpcName = SIGNING_PACKAGE_RPC.issuePackage;
  const result = backendObject(value, rpcName, ["created", "package"]);
  const parsed: IssueSigningPackageResult = {
    created: backendBoolean(result, "created", rpcName),
    package: parseSigningPackage(result.package, rpcName),
  };

  if (
    parsed.package.userId !== userId ||
    parsed.package.onboardingCaseId !== onboardingCaseId
  ) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}

export function parseAdminSigningPackageList(
  value: unknown,
): AdminSigningPackageListItem[] {
  const rpcName = SIGNING_PACKAGE_RPC.getPackageList;
  const packages = backendArrayValue(value, rpcName).map((item) =>
    parseAdminSigningPackageListItem(item, rpcName)
  );

  if (new Set(packages.map((item) => item.id)).size !== packages.length) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return packages;
}

export function parseAdminSigningPackageDetail(
  value: unknown,
  packageId: string,
): AdminSigningPackageDetail {
  const rpcName = SIGNING_PACKAGE_RPC.getPackageDetail;
  const result = backendObject(value, rpcName, [
    "package",
    "coworker",
    "onboardingCase",
  ]);
  const parsed: AdminSigningPackageDetail = {
    package: parseSigningPackage(result.package, rpcName),
    coworker: parseSigningCoworkerSummary(result.coworker, rpcName),
    onboardingCase: parseSigningOnboardingCaseSummary(
      result.onboardingCase,
      rpcName,
    ),
  };

  if (
    parsed.package.id !== packageId ||
    parsed.coworker.userId !== parsed.package.userId ||
    parsed.onboardingCase.id !== parsed.package.onboardingCaseId ||
    parsed.onboardingCase.userId !== parsed.package.userId
  ) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}

function parseAdminSigningPackageListItem(
  value: unknown,
  rpcName: SigningPackageRpcName,
): AdminSigningPackageListItem {
  const result = backendObject(value, rpcName, LIST_ITEM_KEYS);
  const coworker = parseSigningCoworkerSummary(result.coworker, rpcName);
  const userId = backendUuid(result, "userId", rpcName);
  const itemCount = backendPositiveInteger(result, "itemCount", rpcName);
  const pendingItemCount = packageItemCount(
    result,
    "pendingItemCount",
    rpcName,
  );
  const submittedItemCount = packageItemCount(
    result,
    "submittedItemCount",
    rpcName,
  );
  const needsCorrectionItemCount = packageItemCount(
    result,
    "needsCorrectionItemCount",
    rpcName,
  );
  const acceptedItemCount = packageItemCount(
    result,
    "acceptedItemCount",
    rpcName,
  );
  const listedStatusItemCount = pendingItemCount +
    submittedItemCount +
    needsCorrectionItemCount +
    acceptedItemCount;

  if (
    itemCount !== 4 ||
    listedStatusItemCount > itemCount ||
    coworker.userId !== userId
  ) {
    throw new SigningPackageBackendContractError(rpcName);
  }

  return {
    id: backendUuid(result, "id", rpcName),
    userId,
    onboardingCaseId: backendUuid(result, "onboardingCaseId", rpcName),
    coworker,
    status: backendEnum(
      result,
      "status",
      SIGNING_PACKAGE_STATUSES,
      rpcName,
    ),
    itemCount: 4,
    pendingItemCount,
    submittedItemCount,
    needsCorrectionItemCount,
    acceptedItemCount,
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
    acceptedAt: backendNullableTimestamp(result, "acceptedAt", rpcName),
    rejectedAt: backendNullableTimestamp(result, "rejectedAt", rpcName),
    revision: backendPositiveInteger(result, "revision", rpcName),
    updatedAt: backendTimestamp(result, "updatedAt", rpcName),
  };
}

function packageItemCount(
  source: { [key: string]: unknown },
  key: string,
  rpcName: SigningPackageRpcName,
): number {
  const count = backendNonNegativeInteger(source, key, rpcName);
  if (count > 4) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return count;
}
