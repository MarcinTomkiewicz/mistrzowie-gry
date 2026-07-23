import { createSigningPackageModelParsers } from "../_shared/coworker-document-edge/signing-package-model-parser.ts";
import type {
  SigningPackageItemStatus,
  SigningPackageStatus,
} from "../_shared/coworker-document-edge/signing-package-models.ts";
import type { AdminSigningPackageDetail } from "./signing-package-contracts.ts";
import {
  type ApproveOnboardingResult,
  SIGNING_PACKAGE_REVIEW_RPC,
  SigningPackageReviewBackendContractError,
  type SigningPackageReviewRpcName,
  signingPackageReviewReaders,
} from "./signing-package-review-contracts.ts";

interface DetailExpectation {
  packageId?: string;
  packageItemId?: string;
  packageStatus: SigningPackageStatus;
  packageItemStatus?: SigningPackageItemStatus;
}

const {
  backendBoolean,
  backendLiteral,
  backendObject,
  backendTimestamp,
  backendUuid,
} = signingPackageReviewReaders;

const {
  parseSigningCoworkerSummary,
  parseSigningOnboardingCaseSummary,
  parseSigningPackage,
} = createSigningPackageModelParsers(
  signingPackageReviewReaders,
  (rpcName) => new SigningPackageReviewBackendContractError(rpcName),
);

export function parseSigningPackageReviewDetail(
  value: unknown,
  rpcName: SigningPackageReviewRpcName,
  expected: DetailExpectation,
): AdminSigningPackageDetail {
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
    parsed.coworker.userId !== parsed.package.userId ||
    parsed.onboardingCase.id !== parsed.package.onboardingCaseId ||
    parsed.onboardingCase.userId !== parsed.package.userId ||
    parsed.package.status !== expected.packageStatus ||
    (expected.packageId !== undefined &&
      parsed.package.id !== expected.packageId) ||
    !matchesExpectedItem(parsed, expected)
  ) {
    throw new SigningPackageReviewBackendContractError(rpcName);
  }
  return parsed;
}

export function parseApproveOnboardingResult(
  value: unknown,
  userId: string,
  onboardingCaseId: string,
): ApproveOnboardingResult {
  const rpcName = SIGNING_PACKAGE_REVIEW_RPC.approveOnboarding;
  const result = backendObject(value, rpcName, [
    "userId",
    "onboardingCaseId",
    "approved",
    "idempotent",
    "onboardingStatus",
    "onboardingStage",
    "approvedAt",
    "operationalDocumentsAvailable",
  ]);
  const parsed: ApproveOnboardingResult = {
    userId: backendUuid(result, "userId", rpcName),
    onboardingCaseId: backendUuid(result, "onboardingCaseId", rpcName),
    approved: backendLiteral(result, "approved", true, rpcName),
    idempotent: backendBoolean(result, "idempotent", rpcName),
    onboardingStatus: backendLiteral(
      result,
      "onboardingStatus",
      "approved",
      rpcName,
    ),
    onboardingStage: backendLiteral(
      result,
      "onboardingStage",
      "approved",
      rpcName,
    ),
    approvedAt: backendTimestamp(result, "approvedAt", rpcName),
    operationalDocumentsAvailable: backendLiteral(
      result,
      "operationalDocumentsAvailable",
      true,
      rpcName,
    ),
  };

  if (
    parsed.userId !== userId ||
    parsed.onboardingCaseId !== onboardingCaseId
  ) {
    throw new SigningPackageReviewBackendContractError(rpcName);
  }
  return parsed;
}

function matchesExpectedItem(
  detail: AdminSigningPackageDetail,
  expected: DetailExpectation,
): boolean {
  if (expected.packageItemId === undefined) {
    return true;
  }
  return detail.package.items.some((item) =>
    item.id === expected.packageItemId &&
    (expected.packageItemStatus === undefined ||
      item.status === expected.packageItemStatus)
  );
}
