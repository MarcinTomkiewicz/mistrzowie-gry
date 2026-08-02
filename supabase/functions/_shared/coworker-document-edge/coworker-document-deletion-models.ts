import type { CoworkerDocumentOrigin } from "./coworker-document-models.ts";

export const COWORKER_DOCUMENT_DELETION_RPC = {
  getCapabilities: "get_coworker_document_deletion_capabilities",
  requestVersionDeletion: "request_coworker_document_version_deletion",
  requestDocumentDeletion: "request_coworker_document_deletion",
  setVersionPreservation: "set_admin_coworker_document_version_preservation",
} as const;

export const COWORKER_DOCUMENT_PRESERVATION_KINDS = [
  "historical",
  "permanent",
] as const;

export type CoworkerDocumentDeletionRpcName =
  typeof COWORKER_DOCUMENT_DELETION_RPC[
    keyof typeof COWORKER_DOCUMENT_DELETION_RPC
  ];

export type CoworkerDocumentPreservationKind =
  typeof COWORKER_DOCUMENT_PRESERVATION_KINDS[number];

export interface CoworkerDocumentVersionDeletionCapability {
  documentVersionId: string;
  isCurrent: boolean | null;
  canDelete: boolean;
  blockingReasons: string[];
}

export interface CoworkerDocumentDeletionCapabilities {
  documentId: string;
  origin: CoworkerDocumentOrigin;
  deletionRequested: boolean;
  canDeleteDocument: boolean;
  documentBlockingReasons: string[];
  currentVersionId: string | null;
  canDeleteCurrentVersion: boolean;
  currentVersionBlockingReasons: string[];
  versions: CoworkerDocumentVersionDeletionCapability[];
}

export interface DocumentVersionDeletionResult {
  documentId: string;
  documentVersionId: string;
  deletionRequested: true;
  cleanupEnqueued: number;
  capabilities: CoworkerDocumentDeletionCapabilities;
}

export interface DocumentDeletionResult {
  documentId: string;
  deletionRequested: true;
  documentDeleted: boolean;
  cleanupEnqueued: number;
}

export interface DocumentVersionPreservationResult {
  documentId: string;
  documentVersionId: string;
  preservationKind: CoworkerDocumentPreservationKind | null;
  preserved: boolean;
}
