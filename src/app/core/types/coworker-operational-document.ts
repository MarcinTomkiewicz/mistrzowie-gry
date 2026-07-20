import { FormControl, FormGroup } from '@angular/forms';

export const COWORKER_OPERATIONAL_ACTIONS = [
  'acknowledged',
  'accepted',
  'declined',
] as const;

export const COWORKER_OPERATIONAL_ACTION_MODES = [
  'information_only',
  'acknowledgement_required',
  'acceptance_required',
] as const;

export const COWORKER_OPERATIONAL_ASSIGNMENT_STATUSES = [
  'available',
  'pending',
  'acknowledged',
  'accepted',
  'declined',
  'waived',
  'expired',
] as const;

export const COWORKER_OPERATIONAL_ASSIGNMENT_SOURCES = [
  'target_sync',
  'admin_manual',
  'system',
  'migration',
] as const;

export const COWORKER_OPERATIONAL_DOCUMENT_STATUSES = [
  'draft',
  'published',
  'archived',
] as const;

export const COWORKER_OPERATIONAL_VERSION_STATUSES = [
  'reserved',
  'uploaded',
  'ready',
  'published',
  'superseded',
  'archived',
  'failed',
  'deleted',
] as const;

export const COWORKER_OPERATIONAL_ACTION_SOURCES = [
  'web',
  'admin',
  'system',
  'migration',
] as const;

export const COWORKER_OPERATIONAL_EDGE_ACTION = {
  recordAction: 'recordAction',
  downloadDocumentVersion: 'downloadDocumentVersion',
  markNotificationRead: 'markNotificationRead',
} as const;

export const COWORKER_OPERATIONAL_ERROR_CODE = {
  notFound: 'OPERATIONAL_DOCUMENT_NOT_FOUND',
  conflict: 'OPERATIONAL_DOCUMENT_CONFLICT',
  invalidState: 'OPERATIONAL_DOCUMENT_STATE_INVALID',
} as const;

export type CoworkerOperationalAction =
  (typeof COWORKER_OPERATIONAL_ACTIONS)[number];
export type CoworkerOperationalActionMode =
  (typeof COWORKER_OPERATIONAL_ACTION_MODES)[number];
export type CoworkerOperationalAssignmentStatus =
  (typeof COWORKER_OPERATIONAL_ASSIGNMENT_STATUSES)[number];
export type CoworkerOperationalAssignmentSource =
  (typeof COWORKER_OPERATIONAL_ASSIGNMENT_SOURCES)[number];
export type CoworkerOperationalDocumentStatus =
  (typeof COWORKER_OPERATIONAL_DOCUMENT_STATUSES)[number];
export type CoworkerOperationalVersionStatus =
  (typeof COWORKER_OPERATIONAL_VERSION_STATUSES)[number];
export type CoworkerOperationalActionSource =
  (typeof COWORKER_OPERATIONAL_ACTION_SOURCES)[number];

type CoworkerOperationalActionRequestBase = {
  readonly action: typeof COWORKER_OPERATIONAL_EDGE_ACTION.recordAction;
  readonly assignmentId: string;
};

export type RecordCoworkerOperationalActionRequest =
  CoworkerOperationalActionRequestBase & (
    | {
        readonly documentAction: 'acknowledged' | 'accepted';
        readonly declineReason: null;
      }
    | {
        readonly documentAction: 'declined';
        readonly declineReason: string;
      }
  );

export type CoworkerOperationalRequest =
  | RecordCoworkerOperationalActionRequest
  | {
      readonly action:
        typeof COWORKER_OPERATIONAL_EDGE_ACTION.downloadDocumentVersion;
      readonly documentVersionId: string;
    }
  | {
      readonly action:
        typeof COWORKER_OPERATIONAL_EDGE_ACTION.markNotificationRead;
      readonly notificationId: string;
    };

export type CoworkerOperationalActionForm = FormGroup<{
  declineReason: FormControl<string>;
}>;
