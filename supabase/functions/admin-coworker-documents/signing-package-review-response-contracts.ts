import { createSigningPackageModelParsers } from "../_shared/coworker-document-edge/signing-package-model-parser.ts";
import type {
  SigningPackage,
  SigningPackageItemStatus,
  SigningPackageStatus,
} from "../_shared/coworker-document-edge/signing-package-models.ts";
import {
  type ApproveOnboardingResult,
  SIGNING_PACKAGE_REVIEW_RPC,
  SigningPackageReviewBackendContractError,
  signingPackageReviewReaders,
  type SigningPackageReviewRpcName,
} from "./signing-package-review-contracts.ts";

interface DetailExpectation {
  packageId?: string;
  packageItemId?: string;
  status: SigningPackageStatus;
  itemStatus?: SigningPackageItemStatus;
}

const {
  backendBoolean,
  backendLiteral,
  backendObject,
  backendTimestamp,
  backendUuid,
} = signingPackageReviewReaders;

const { parseSigningPackage } = createSigningPackageModelParsers(
  signingPackageReviewReaders,
  (rpcName) => new SigningPackageReviewBackendContractError(rpcName),
);

export function parseSigningPackageReviewResult(
  value: unknown,
  rpcName: SigningPackageReviewRpcName,
  expected: DetailExpectation,
): SigningPackage {
  const parsed = parseSigningPackage(value, rpcName);

  if (
    parsed.status !== expected.status ||
    (expected.packageId !== undefined &&
      parsed.id !== expected.packageId) ||
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
  packageModel: SigningPackage,
  expected: DetailExpectation,
): boolean {
  if (expected.packageItemId === undefined) {
    return true;
  }
  return packageModel.items.some((item) =>
    item.id === expected.packageItemId &&
    (expected.itemStatus === undefined || item.status === expected.itemStatus)
  );
}
