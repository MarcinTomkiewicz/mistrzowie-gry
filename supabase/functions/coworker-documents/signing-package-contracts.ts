import type {
  SigningOnboardingCaseSummary,
  SigningPackage,
} from "../_shared/coworker-document-edge/signing-package-models.ts";
import type {
  SignatureDeclarationType,
  UploadFilePayload,
} from "./upload-request-contracts.ts";

export const COWORKER_SIGNING_PACKAGE_RPC = {
  getPortal: "get_coworker_signing_package_portal",
  getSourceDownloadTarget:
    "get_coworker_signing_package_source_download_target",
  reserveItemUpload: "reserve_coworker_signing_package_item_upload",
  submitItem: "submit_coworker_signing_package_item",
} as const;

export type CoworkerSigningPackageRpcName =
  typeof COWORKER_SIGNING_PACKAGE_RPC[
    keyof typeof COWORKER_SIGNING_PACKAGE_RPC
  ];

export const COWORKER_SIGNING_PACKAGE_ACTIONS = [
  "getSigningPackagePortal",
  "downloadSigningPackageSource",
  "reserveSigningPackageItemUpload",
  "recoverUpload",
  "submitSigningPackageItem",
] as const;

export type ReserveSigningPackageItemUploadPayload = UploadFilePayload;

export interface GetSigningPackagePortalAction {
  action: "getSigningPackagePortal";
}

export interface DownloadSigningPackageSourceAction {
  action: "downloadSigningPackageSource";
  packageItemId: string;
}

export interface ReserveSigningPackageItemUploadAction {
  action: "reserveSigningPackageItemUpload";
  packageItemId: string;
  upload: ReserveSigningPackageItemUploadPayload;
}

export interface RecoverUploadAction {
  action: "recoverUpload";
  uploadSessionId: string;
}

export interface SubmitSigningPackageItemAction {
  action: "submitSigningPackageItem";
  packageItemId: string;
}

export type CoworkerSigningPackageActionRequest =
  | GetSigningPackagePortalAction
  | DownloadSigningPackageSourceAction
  | ReserveSigningPackageItemUploadAction
  | RecoverUploadAction
  | SubmitSigningPackageItemAction;

export interface SigningPackageUploadRecovery {
  packageItemId: string;
  uploadSessionId: string;
  documentId: string;
  documentVersionId: string;
  originalFilename: string;
  declaredMimeType: string;
  expectedSizeBytes: number;
  expiresAt: string;
  canActivate: boolean;
  canFinalize: boolean;
  canCancel: boolean;
  cleanupStatus: "not_required" | "pending" | "completed" | "failed";
}

export interface CoworkerSigningPackagePortal {
  userId: string;
  onboardingCase: SigningOnboardingCaseSummary;
  package: SigningPackage | null;
  uploadRecovery: SigningPackageUploadRecovery | null;
  viewer: {
    actorUserId: string;
    isAdmin: false;
  };
}

export interface SigningPackageSourceDownloadTarget {
  packageItemId: string;
  packageId: string;
  sourceId: string;
  sourceVersionId: string;
  sourceVersionNumber: number;
  bucket: string;
  path: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  signedUrlExpiresInSeconds: number;
}

export interface SigningPackageItemUploadReservation {
  packageId: string;
  packageItemId: string;
  documentId: string;
  documentCreated: boolean;
  documentVersionId: string;
  versionNumber: number;
  uploadSessionId: string;
  sessionStatus: "created";
  bucket: string;
  path: string;
  originalFilename: string;
  storedFilename: string;
  declaredMimeType: string;
  expectedSizeBytes: number;
  signatureDeclarationType: SignatureDeclarationType;
  expiresAt: string;
}

export interface SubmitSigningPackageItemResult {
  packageId: string;
  packageItemId: string;
  documentId: string;
  documentVersionId: string;
  itemStatus: "submitted";
  packageStatus: "in_progress" | "submitted";
  submittedAt: string;
  packageSubmittedAt: string | null;
  idempotent: boolean;
}

export function isCoworkerSigningPackageRpcName(
  value: string,
): value is CoworkerSigningPackageRpcName {
  return Object.values(COWORKER_SIGNING_PACKAGE_RPC).some(
    (name) => name === value,
  );
}
