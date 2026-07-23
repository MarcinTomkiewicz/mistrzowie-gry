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
