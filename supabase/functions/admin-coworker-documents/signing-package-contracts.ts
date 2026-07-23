import { createContractReaders } from "../_shared/coworker-document-edge/contract-readers.ts";

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

export const SIGNING_PACKAGE_STATUSES = [
  "issued",
  "in_progress",
  "submitted",
  "under_review",
  "needs_correction",
  "rejected",
  "accepted",
] as const;

export const SIGNING_PACKAGE_ITEM_STATUSES = [
  "pending",
  "submitted",
  "under_review",
  "needs_correction",
  "rejected",
  "accepted",
] as const;

export const ONBOARDING_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "needs_correction",
  "approved",
  "suspended",
] as const;

export const ONBOARDING_STAGES = [
  "questionnaire",
  "signing_package",
  "approved",
] as const;

export const SIGNING_PACKAGE_DOCUMENTS = [
  { sequence: 1, documentCode: "mandate_contract" },
  { sequence: 2, documentCode: "safety_protocol" },
  { sequence: 3, documentCode: "cooperation_rules" },
  { sequence: 4, documentCode: "loyalty_rules" },
] as const;

export type SigningPackageStatus =
  typeof SIGNING_PACKAGE_STATUSES[number];
export type SigningPackageItemStatus =
  typeof SIGNING_PACKAGE_ITEM_STATUSES[number];
export type OnboardingStatus = typeof ONBOARDING_STATUSES[number];
export type OnboardingStage = typeof ONBOARDING_STAGES[number];
export type PackageDocumentCode =
  typeof SIGNING_PACKAGE_DOCUMENTS[number]["documentCode"];

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

export interface SigningCoworkerSummary {
  userId: string;
  displayName: string;
  email: string;
}

export interface SigningOnboardingCaseSummary {
  id: string;
  userId: string;
  status: OnboardingStatus;
  stage: OnboardingStage;
  openedAt: string;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  needsCorrectionAt: string | null;
  approvedAt: string | null;
  suspendedAt: string | null;
  closedAt: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface SigningPackageItem {
  id: string;
  packageId: string;
  sequence: 1 | 2 | 3 | 4;
  documentCode: PackageDocumentCode;
  title: string;
  sourceId: string;
  sourceVersionId: string;
  sourceVersionNumber: number;
  requirementId: string;
  documentDefinitionId: string;
  documentId: string | null;
  currentDocumentVersionId: string | null;
  status: SigningPackageItemStatus;
  correctionReason: string | null;
  correctionNote: string | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SigningPackage {
  id: string;
  userId: string;
  onboardingCaseId: string;
  status: SigningPackageStatus;
  issuedAt: string;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  needsCorrectionAt: string | null;
  rejectedAt: string | null;
  acceptedAt: string | null;
  rejectionReason: string | null;
  note: string | null;
  revision: number;
  items: SigningPackageItem[];
  createdAt: string;
  updatedAt: string;
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
