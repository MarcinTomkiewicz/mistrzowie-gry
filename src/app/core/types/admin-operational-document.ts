import type { ConfigureAdminOperationalVersionPayload } from './admin-operational-version';
import type { ReserveAdminOperationalUploadPayload } from './admin-operational-upload';

export const ADMIN_OPERATIONAL_EDGE_ACTION = {
  getDocumentDetail: 'getDocumentDetail',
  saveDocument: 'saveDocument',
  reserveUpload: 'reserveUpload',
  finalizeUpload: 'finalizeUpload',
  cancelUpload: 'cancelUpload',
  configureVersion: 'configureVersion',
  publishVersion: 'publishVersion',
  getAssignmentList: 'getAssignmentList',
  waiveAssignment: 'waiveAssignment',
  archiveDocument: 'archiveDocument',
  downloadDocumentVersion: 'downloadDocumentVersion',
} as const;

export const ADMIN_OPERATIONAL_ERROR_CODE = {
  notFound: 'OPERATIONAL_DOCUMENT_NOT_FOUND',
  conflict: 'OPERATIONAL_DOCUMENT_CONFLICT',
  invalidState: 'OPERATIONAL_DOCUMENT_STATE_INVALID',
  uploadedFile: 'UPLOADED_FILE_INVALID',
  storage: 'STORAGE_ERROR',
  storageCleanup: 'STORAGE_CLEANUP_FAILED',
} as const;

export type SaveAdminOperationalDocumentPayload = {
  readonly id: string | null;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
};

export type AdminOperationalDownloadPurpose =
  | 'admin_review'
  | 'admin_download';

export type DownloadAdminOperationalVersionRequest = {
  readonly documentVersionId: string;
  readonly purpose: AdminOperationalDownloadPurpose;
};

export type AdminOperationalRequest =
  | {
      readonly action:
        typeof ADMIN_OPERATIONAL_EDGE_ACTION.getDocumentDetail;
      readonly documentId: string;
    }
  | {
      readonly action: typeof ADMIN_OPERATIONAL_EDGE_ACTION.saveDocument;
      readonly document: SaveAdminOperationalDocumentPayload;
    }
  | {
      readonly action: typeof ADMIN_OPERATIONAL_EDGE_ACTION.reserveUpload;
      readonly upload: ReserveAdminOperationalUploadPayload;
    }
  | {
      readonly action:
        | typeof ADMIN_OPERATIONAL_EDGE_ACTION.finalizeUpload
        | typeof ADMIN_OPERATIONAL_EDGE_ACTION.cancelUpload;
      readonly uploadSessionId: string;
    }
  | {
      readonly action: typeof ADMIN_OPERATIONAL_EDGE_ACTION.configureVersion;
      readonly configuration: ConfigureAdminOperationalVersionPayload;
    }
  | {
      readonly action:
        | typeof ADMIN_OPERATIONAL_EDGE_ACTION.publishVersion
        | typeof ADMIN_OPERATIONAL_EDGE_ACTION.getAssignmentList;
      readonly documentVersionId: string;
    }
  | {
      readonly action: typeof ADMIN_OPERATIONAL_EDGE_ACTION.waiveAssignment;
      readonly assignmentId: string;
      readonly reason: string;
    }
  | {
      readonly action: typeof ADMIN_OPERATIONAL_EDGE_ACTION.archiveDocument;
      readonly documentId: string;
    }
  | {
      readonly action:
        typeof ADMIN_OPERATIONAL_EDGE_ACTION.downloadDocumentVersion;
      readonly documentVersionId: string;
      readonly purpose: AdminOperationalDownloadPurpose;
    };
