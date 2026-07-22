import { ADMIN_OPERATIONAL_UPLOAD_FORMATS } from '../configs/admin-coworker-operational-documents.config';
import type { CoworkerOperationalActionMode } from './coworker-operational-document';

export const OPERATIONAL_UPLOAD_SESSION_STATUSES = [
  'created',
  'uploaded',
  'expired',
  'failed',
  'cancelled',
] as const;

export const OPERATIONAL_RECOVERY_VERSION_STATUSES = [
  'reserved',
  'uploaded',
  'failed',
  'deleted',
] as const;

export const ADMIN_OPERATIONAL_CLEANUP_STATUSES = [
  'not_required',
  'pending',
  'completed',
  'failed',
] as const;

export const ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES =
  ADMIN_OPERATIONAL_UPLOAD_FORMATS.map((format) => format.mimeType);

export type AdminOperationalUploadSessionStatus =
  (typeof OPERATIONAL_UPLOAD_SESSION_STATUSES)[number];
export type AdminOperationalRecoveryVersionStatus =
  (typeof OPERATIONAL_RECOVERY_VERSION_STATUSES)[number];
export type AdminOperationalCleanupStatus =
  (typeof ADMIN_OPERATIONAL_CLEANUP_STATUSES)[number];
export type AdminOperationalUploadMimeType =
  (typeof ADMIN_OPERATIONAL_UPLOAD_FORMATS)[number]['mimeType'];
export type AdminOperationalUploadFileError = 'name' | 'type' | 'size';

export type AdminOperationalUploadFileValidation =
  | {
      readonly error: null;
      readonly originalFilename: string;
      readonly declaredMimeType: AdminOperationalUploadMimeType;
    }
  | {
      readonly error: AdminOperationalUploadFileError;
    };

export type ReserveAdminOperationalUploadPayload = {
  readonly documentId: string;
  readonly title: string;
  readonly summary: string | null;
  readonly actionMode: CoworkerOperationalActionMode;
  readonly requiresReacceptance: boolean;
  readonly statementVersion: number;
  readonly actionDueAt: string | null;
  readonly originalFilename: string;
  readonly declaredMimeType: AdminOperationalUploadMimeType;
  readonly sizeBytes: number;
};

export type AdminOperationalUploadRecovery = {
  readonly uploadSessionId: string;
  readonly documentVersionId: string;
  readonly sessionStatus: AdminOperationalUploadSessionStatus;
  readonly versionStatus: AdminOperationalRecoveryVersionStatus;
  readonly expiresAt: string;
  readonly expired: boolean;
  readonly cleanupStatus: AdminOperationalCleanupStatus;
  readonly canFinalize: boolean;
  readonly canCancel: boolean;
};

export type AdminOperationalUploadReservation = {
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly versionNumber: number;
  readonly uploadSessionId: string;
  readonly originalFilename: string;
  readonly storedFilename: string;
  readonly declaredMimeType: AdminOperationalUploadMimeType;
  readonly expectedSizeBytes: number;
};

export type AdminOperationalSignedUpload = {
  readonly path: string;
  readonly token: string;
  readonly signedUrl: string;
  readonly expiresAt: string;
};

export type AdminOperationalUploadReservationResult = {
  readonly upload: AdminOperationalUploadReservation;
  readonly signedUpload: AdminOperationalSignedUpload;
};

export type AdminOperationalFinalizeContext =
  | {
      readonly kind: 'reservation';
      readonly upload: ReserveAdminOperationalUploadPayload;
      readonly reservation: AdminOperationalUploadReservationResult;
    }
  | {
      readonly kind: 'recovery';
      readonly documentId: string;
      readonly recovery: AdminOperationalUploadRecovery;
    };

export type AdminOperationalUploadState =
  | 'idle'
  | 'reserving'
  | 'uploading'
  | 'finalizing'
  | 'cancelling';
