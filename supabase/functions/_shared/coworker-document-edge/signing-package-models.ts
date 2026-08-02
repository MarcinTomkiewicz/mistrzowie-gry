import {
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
  type CoworkerDocument,
  type CoworkerDocumentDefinition,
} from "./coworker-document-models.ts";

export const SIGNING_PACKAGE_STATUSES = [
  "draft",
  "issued",
  "in_progress",
  "under_review",
  "needs_correction",
  "approved",
  "rejected",
  "cancelled",
] as const;

export const SIGNING_PACKAGE_ITEM_STATUSES = [
  "awaiting_signature",
  "submitted",
  "under_review",
  "needs_correction",
  "accepted",
  "rejected",
  "cancelled",
] as const;

export const SIGNING_PACKAGE_REASONS = [
  "onboarding",
  "document_update",
] as const;

export const SIGNING_PACKAGE_SOURCE_SCOPES = [
  "global_template",
  "onboarding_case",
] as const;

export const SIGNING_PACKAGE_SOURCE_STATUSES = [
  "published",
  "superseded",
  "archived",
] as const;

export const SIGNING_PACKAGE_SHA256_BASE64_PATTERN = /^[A-Za-z0-9+/]{43}=$/;

export type SigningPackageStatus = typeof SIGNING_PACKAGE_STATUSES[number];
export type SigningPackageItemStatus =
  typeof SIGNING_PACKAGE_ITEM_STATUSES[number];
export type SigningPackageReason = typeof SIGNING_PACKAGE_REASONS[number];

export interface SigningPackageRequirement {
  id: string;
  onboardingCaseId: string | null;
  status: typeof COWORKER_DOCUMENT_REQUIREMENT_STATUSES[number];
  required: boolean;
  dueAt: string | null;
  fulfilledByDocumentId: string | null;
  fulfilledAt: string | null;
  waivedAt: string | null;
  waiverReason: string | null;
}

export interface SigningPackageSourceFile {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SigningPackageSource {
  sourceId: string;
  sourceVersionId: string;
  versionNumber: number;
  sourceScope: typeof SIGNING_PACKAGE_SOURCE_SCOPES[number];
  status: typeof SIGNING_PACKAGE_SOURCE_STATUSES[number];
  sha256Base64: string;
  file: SigningPackageSourceFile;
  downloadAvailable: boolean;
}

export interface SigningPackageSummary {
  total: number;
  awaitingSignature: number;
  submitted: number;
  underReview: number;
  needsCorrection: number;
  accepted: number;
  rejected: number;
}

export interface SigningPackageItem {
  id: string;
  packageId: string;
  status: SigningPackageItemStatus;
  documentDefinition: CoworkerDocumentDefinition;
  requirement: SigningPackageRequirement;
  source: SigningPackageSource;
  signedDocumentId: string | null;
  signedDocumentVersionId: string | null;
  signedDocument: CoworkerDocument | null;
  submittedAt: string | null;
  reviewStartedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  canUpload: boolean;
  canSubmit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SigningPackage {
  id: string;
  userId: string;
  onboardingCaseId: string | null;
  reason: SigningPackageReason;
  status: SigningPackageStatus;
  revision: number;
  issuedAt: string | null;
  reviewStartedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  items: SigningPackageItem[];
  summary: SigningPackageSummary;
  createdAt: string;
  updatedAt: string;
}
