import {
  CoworkerDocumentOrigin,
  CoworkerDocumentPreservationKind,
} from '../types/coworker-document';

export interface ICoworkerDocumentVersionDeletionCapability {
  readonly documentVersionId: string;
  readonly isCurrent: boolean | null;
  readonly canDelete: boolean;
  readonly blockingReasons: readonly string[];
}

export interface ICoworkerDocumentDeletionCapabilities {
  readonly documentId: string;
  readonly origin: CoworkerDocumentOrigin;
  readonly deletionRequested: boolean;
  readonly canDeleteDocument: boolean;
  readonly documentBlockingReasons: readonly string[];
  readonly currentVersionId: string | null;
  readonly canDeleteCurrentVersion: boolean;
  readonly currentVersionBlockingReasons: readonly string[];
  readonly versions: readonly ICoworkerDocumentVersionDeletionCapability[];
}

export interface ICoworkerDocumentVersionDeletionResult {
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly deletionRequested: true;
  readonly cleanupEnqueued: number;
  readonly capabilities: ICoworkerDocumentDeletionCapabilities;
}

export interface ICoworkerDocumentDeletionResult {
  readonly documentId: string;
  readonly deletionRequested: true;
  readonly documentDeleted: boolean;
  readonly cleanupEnqueued: number;
}

export interface ICoworkerDocumentVersionPreservationResult {
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly preservationKind: CoworkerDocumentPreservationKind | null;
  readonly preserved: boolean;
}
