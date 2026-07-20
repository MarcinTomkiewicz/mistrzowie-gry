import { ICoworkerNotification } from './i-coworker-document';
import {
  CoworkerOperationalAction,
  CoworkerOperationalActionMode,
  CoworkerOperationalActionSource,
  CoworkerOperationalAssignmentSource,
  CoworkerOperationalAssignmentStatus,
  CoworkerOperationalDocumentStatus,
  CoworkerOperationalVersionStatus,
} from '../types/coworker-operational-document';

export interface ICoworkerOperationalDocument {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly status: CoworkerOperationalDocumentStatus;
  readonly currentPublishedVersionId: string | null;
}

export interface ICoworkerOperationalFile {
  readonly originalFilename: string;
  readonly declaredMimeType: string;
  readonly detectedMimeType: string | null;
  readonly sizeBytes: number | null;
  readonly contentSha256Base64: string | null;
}

export interface ICoworkerOperationalVersion {
  readonly id: string;
  readonly versionNumber: number;
  readonly status: CoworkerOperationalVersionStatus;
  readonly title: string;
  readonly summary: string | null;
  readonly actionMode: CoworkerOperationalActionMode;
  readonly requiresReacceptance: boolean;
  readonly statementVersion: number;
  readonly actionDueAt: string | null;
  readonly publishedAt: string | null;
  readonly file: ICoworkerOperationalFile;
}

export interface ICoworkerOperationalStatement {
  readonly id: string;
  readonly action: CoworkerOperationalAction;
  readonly statementVersion: number;
  readonly text: string;
  readonly sha256Base64: string;
}

export interface ICoworkerOperationalCurrentAction {
  readonly id: string;
  readonly action: CoworkerOperationalAction;
  readonly statementId: string;
  readonly statementVersion: number;
  readonly statementSha256Base64: string;
  readonly statementText: string;
  readonly declineReason: string | null;
  readonly source: CoworkerOperationalActionSource;
  readonly actorUserId: string;
  readonly actedAt: string;
}

export interface ICoworkerOperationalInheritedAssignment {
  readonly assignmentId: string;
  readonly documentVersionId: string;
  readonly versionNumber: number;
  readonly status: CoworkerOperationalAssignmentStatus;
  readonly acknowledgedAt: string | null;
  readonly acceptedAt: string | null;
}

interface ICoworkerOperationalAssignmentBase {
  readonly id: string;
  readonly userId: string;
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly assignmentSource: CoworkerOperationalAssignmentSource;
  readonly assignedAt: string;
  readonly dueAt: string | null;
  readonly acknowledgedAt: string | null;
  readonly acceptedAt: string | null;
  readonly declinedAt: string | null;
  readonly declineReason: string | null;
  readonly waivedAt: string | null;
  readonly waiverReason: string | null;
  readonly satisfiedByAssignmentId: string | null;
  readonly satisfiedByPreviousVersion: boolean;
  readonly document: ICoworkerOperationalDocument;
  readonly version: ICoworkerOperationalVersion;
  readonly statements: readonly ICoworkerOperationalStatement[];
  readonly currentAction: ICoworkerOperationalCurrentAction | null;
  readonly inheritedFrom: ICoworkerOperationalInheritedAssignment | null;
  readonly isCurrentPublishedVersion: boolean;
  readonly canAct: boolean;
  readonly downloadAvailable: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ICoworkerOperationalAssignment =
  ICoworkerOperationalAssignmentBase & (
    | {
        readonly actionMode: 'information_only';
        readonly status: 'available' | 'waived' | 'expired';
      }
    | {
        readonly actionMode: 'acknowledgement_required';
        readonly status: 'pending' | 'acknowledged' | 'waived' | 'expired';
      }
    | {
        readonly actionMode: 'acceptance_required';
        readonly status:
          | 'pending'
          | 'accepted'
          | 'declined'
          | 'waived'
          | 'expired';
      }
  );

export interface ICoworkerOperationalPortal {
  readonly userId: string;
  readonly assignments: readonly ICoworkerOperationalAssignment[];
  readonly notifications: readonly (
    ICoworkerNotification & { readonly entityType: 'operational_document' }
  )[];
  readonly unreadNotificationCount: number;
}
