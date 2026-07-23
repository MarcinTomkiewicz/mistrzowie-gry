import { createContractReaders } from "../_shared/coworker-document-edge/contract-readers.ts";
import {
  type SigningCoworkerSummary,
  type SigningOnboardingCaseSummary,
  type SigningPackage,
  type SigningPackageStatus,
} from "../_shared/coworker-document-edge/signing-package-models.ts";

export {
  ONBOARDING_STAGES,
  ONBOARDING_STATUSES,
  SIGNING_PACKAGE_DOCUMENTS,
  SIGNING_PACKAGE_ITEM_STATUSES,
  SIGNING_PACKAGE_STATUSES,
} from "../_shared/coworker-document-edge/signing-package-models.ts";
export type {
  OnboardingStage,
  OnboardingStatus,
  PackageDocumentCode,
  SigningCoworkerSummary,
  SigningOnboardingCaseSummary,
  SigningPackage,
  SigningPackageItem,
  SigningPackageItemStatus,
  SigningPackageStatus,
} from "../_shared/coworker-document-edge/signing-package-models.ts";

export const SIGNING_PACKAGE_RPC = {
  recordQuestionnaireDelivery:
    "record_admin_coworker_document_external_delivery",
  issuePackage: "issue_admin_coworker_signing_package",
  getPackageList: "get_admin_coworker_signing_package_list",
  getPackageDetail: "get_admin_coworker_signing_package_detail",
} as const;

export type SigningPackageRpcName =
  typeof SIGNING_PACKAGE_RPC[keyof typeof SIGNING_PACKAGE_RPC];

export const SIGNING_PACKAGE_ACTIONS = [
  "recordQuestionnaireDelivery",
  "issueSigningPackage",
  "getSigningPackageList",
  "getSigningPackageDetail",
] as const;

export interface RecordQuestionnaireDeliveryAction {
  action: "recordQuestionnaireDelivery";
  userId: string;
  onboardingCaseId: string;
  documentId: string;
  documentVersionId: string;
  note: string | null;
}

export interface IssueSigningPackageAction {
  action: "issueSigningPackage";
  userId: string;
  onboardingCaseId: string;
}

export interface GetSigningPackageListAction {
  action: "getSigningPackageList";
}

export interface GetSigningPackageDetailAction {
  action: "getSigningPackageDetail";
  packageId: string;
}

export type SigningPackageActionRequest =
  | RecordQuestionnaireDeliveryAction
  | IssueSigningPackageAction
  | GetSigningPackageListAction
  | GetSigningPackageDetailAction;

export interface CoworkerDocumentExternalDelivery {
  id: string;
  userId: string;
  onboardingCaseId: string;
  documentId: string;
  documentVersionId: string;
  destination: "accounting";
  deliveryType: "onboarding_questionnaire";
  note: string | null;
  deliveredBy: string;
  deliveredAt: string;
  createdAt: string;
}

export interface ExternalDeliveryResult {
  created: boolean;
  delivery: CoworkerDocumentExternalDelivery;
}

export interface AdminSigningPackageListItem {
  id: string;
  userId: string;
  onboardingCaseId: string;
  coworker: SigningCoworkerSummary;
  status: SigningPackageStatus;
  itemCount: 4;
  pendingItemCount: number;
  submittedItemCount: number;
  needsCorrectionItemCount: number;
  acceptedItemCount: number;
  issuedAt: string;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  revision: number;
  updatedAt: string;
}

export interface AdminSigningPackageDetail {
  package: SigningPackage;
  coworker: SigningCoworkerSummary;
  onboardingCase: SigningOnboardingCaseSummary;
}

export interface IssueSigningPackageResult {
  created: boolean;
  package: SigningPackage;
}

export class SigningPackageRequestValidationError extends Error {
  constructor(readonly fieldErrors: { [field: string]: string }) {
    super("Signing package request validation failed.");
    this.name = "SigningPackageRequestValidationError";
  }
}

export class SigningPackageBackendContractError extends Error {
  constructor(readonly rpcName: SigningPackageRpcName) {
    super("Signing package backend contract validation failed.");
    this.name = "SigningPackageBackendContractError";
  }
}

export const signingPackageReaders =
  createContractReaders<SigningPackageRpcName>({
    createRequestError: (fieldErrors) =>
      new SigningPackageRequestValidationError(fieldErrors),
    createBackendError: (rpcName) =>
      new SigningPackageBackendContractError(rpcName),
  });

export function isSigningPackageRpcName(
  value: string,
): value is SigningPackageRpcName {
  return Object.values(SIGNING_PACKAGE_RPC).some((name) => name === value);
}
