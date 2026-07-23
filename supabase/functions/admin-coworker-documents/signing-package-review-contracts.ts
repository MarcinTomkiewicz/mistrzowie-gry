import { createContractReaders } from "../_shared/coworker-document-edge/contract-readers.ts";
import { SigningPackageRequestValidationError } from "./signing-package-contracts.ts";

export const SIGNING_PACKAGE_REVIEW_RPC = {
  startReview: "start_admin_coworker_signing_package_review",
  returnItemForCorrection:
    "return_admin_coworker_signing_package_item_for_correction",
  rejectPackage: "reject_admin_coworker_signing_package",
  acceptPackage: "accept_admin_coworker_signing_package",
  approveOnboarding: "approve_admin_coworker_onboarding_case",
} as const;

export type SigningPackageReviewRpcName =
  typeof SIGNING_PACKAGE_REVIEW_RPC[
    keyof typeof SIGNING_PACKAGE_REVIEW_RPC
  ];

export const SIGNING_PACKAGE_REVIEW_ACTIONS = [
  "startSigningPackageReview",
  "returnSigningPackageItemForCorrection",
  "rejectSigningPackage",
  "acceptSigningPackage",
  "approveOnboarding",
] as const;

export interface StartSigningPackageReviewAction {
  action: "startSigningPackageReview";
  packageId: string;
}

export interface ReturnSigningPackageItemForCorrectionAction {
  action: "returnSigningPackageItemForCorrection";
  packageItemId: string;
  reason: string;
  note: string | null;
}

export interface RejectSigningPackageAction {
  action: "rejectSigningPackage";
  packageId: string;
  reason: string;
  note: string | null;
}

export interface AcceptSigningPackageAction {
  action: "acceptSigningPackage";
  packageId: string;
  note: string | null;
}

export interface ApproveOnboardingAction {
  action: "approveOnboarding";
  userId: string;
  onboardingCaseId: string;
}

export type SigningPackageReviewActionRequest =
  | StartSigningPackageReviewAction
  | ReturnSigningPackageItemForCorrectionAction
  | RejectSigningPackageAction
  | AcceptSigningPackageAction
  | ApproveOnboardingAction;

export interface ApproveOnboardingResult {
  userId: string;
  onboardingCaseId: string;
  approved: true;
  idempotent: boolean;
  onboardingStatus: "approved";
  onboardingStage: "approved";
  approvedAt: string;
  operationalDocumentsAvailable: true;
}

export class SigningPackageReviewBackendContractError extends Error {
  constructor(readonly rpcName: SigningPackageReviewRpcName) {
    super("Signing package review backend contract validation failed.");
    this.name = "SigningPackageReviewBackendContractError";
  }
}

export const signingPackageReviewReaders =
  createContractReaders<SigningPackageReviewRpcName>({
    createRequestError: (fieldErrors) =>
      new SigningPackageRequestValidationError(fieldErrors),
    createBackendError: (rpcName) =>
      new SigningPackageReviewBackendContractError(rpcName),
  });

export function isSigningPackageReviewRpcName(
  value: string,
): value is SigningPackageReviewRpcName {
  return Object.values(SIGNING_PACKAGE_REVIEW_RPC).some(
    (name) => name === value,
  );
}
