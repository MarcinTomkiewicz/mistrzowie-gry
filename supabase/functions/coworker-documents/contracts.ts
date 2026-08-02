import {
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
  type CoworkerDocumentDefinition,
  type CoworkerDocumentStatus,
  type CoworkerDocumentVersion,
  type CoworkerOnboardingCase,
} from "../_shared/coworker-document-edge/coworker-document-models.ts";
import type { SignatureDeclarationType } from "./upload-request-contracts.ts";

export {
  BackendContractError,
  RequestValidationError,
} from "./contract-context.ts";
export type { UnknownObject } from "./contract-context.ts";
export type { SignatureDeclarationType } from "./upload-request-contracts.ts";

export const RPC = {
  getPortal: "get_coworker_document_portal",
  reserveUpload: "reserve_coworker_document_upload",
  activateSignedUpload: "activate_coworker_document_signed_upload",
  finalizeUpload: "finalize_coworker_document_upload",
  cancelUpload: "cancel_coworker_document_upload",
  recordCleanup: "record_coworker_document_storage_cleanup_result",
  submitDocument: "submit_coworker_document",
  withdrawDocument: "withdraw_coworker_document",
  getDownloadTarget: "get_coworker_document_download_target",
  markNotificationRead: "mark_coworker_notification_read",
} as const;

export type RpcName = typeof RPC[keyof typeof RPC];

export interface CoworkerDocumentPortalAccess {
  enabled: boolean;
  grantedAt: string | null;
  grantedViaRole: boolean;
}

export interface CoworkerDocumentPortalViewer {
  actorUserId: string;
  isAdmin: boolean;
}

export interface CoworkerDocumentPortalSource {
  id: string;
  origin: "system_generated" | "admin_upload";
  title: string | null;
  status: CoworkerDocumentStatus;
  currentVersion: CoworkerDocumentVersion | null;
  historyCount: number;
}

export interface CoworkerDocumentPortalSubmission {
  id: string;
  origin: "coworker_upload";
  title: string | null;
  status: CoworkerDocumentStatus;
  currentVersion: CoworkerDocumentVersion | null;
  submittedVersionId: string | null;
  historyCount: number;
}

export interface CoworkerDocumentPortalRequirement {
  id: string;
  onboardingCaseId: string | null;
  status: typeof COWORKER_DOCUMENT_REQUIREMENT_STATUSES[number];
  required: boolean;
  dueAt: string | null;
  fulfilledByDocumentId: string | null;
  fulfilledAt: string | null;
  waivedAt: string | null;
  waiverReason: string | null;
  documentDefinition: CoworkerDocumentDefinition;
  sourceDocument: CoworkerDocumentPortalSource | null;
  submissionDocument: CoworkerDocumentPortalSubmission | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoworkerDocumentNotification {
  id: string;
  eventCode: string;
  severity: string;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface CoworkerDocumentPortal {
  userId: string;
  access: CoworkerDocumentPortalAccess;
  activeOnboardingCase: CoworkerOnboardingCase | null;
  requirements: CoworkerDocumentPortalRequirement[];
  documentCatalog: CoworkerDocumentDefinition[];
  notifications: CoworkerDocumentNotification[];
  unreadNotificationCount: number;
  viewer: CoworkerDocumentPortalViewer;
}

export interface ReserveUploadAction {
  action: "reserveUpload";
  documentId: string | null;
  requirementId: string | null;
  documentDefinitionId: string | null;
  onboardingCaseId: string | null;
  originalFilename: string;
  declaredMimeType: string;
  sizeBytes: number;
  signatureDeclarationType: SignatureDeclarationType;
  title: string | null;
}

export type UploadSessionAction =
  | {
    action: "finalizeUpload";
    uploadSessionId: string;
  }
  | {
    action: "cancelUpload";
    uploadSessionId: string;
  };

export interface SubmitDocumentAction {
  action: "submitDocument";
  documentId: string;
  documentVersionId: string;
}

export interface WithdrawDocumentAction {
  action: "withdrawDocument";
  documentId: string;
}

export interface DownloadAction {
  action: "downloadDocumentVersion";
  documentVersionId: string;
}

export interface NotificationAction {
  action: "markNotificationRead";
  notificationId: string;
}

export type CoworkerDocumentActionRequest =
  | ReserveUploadAction
  | UploadSessionAction
  | SubmitDocumentAction
  | WithdrawDocumentAction
  | DownloadAction
  | NotificationAction;
