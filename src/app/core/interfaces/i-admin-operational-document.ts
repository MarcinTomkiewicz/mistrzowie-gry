import type {
  AdminOperationalStoredVersion,
  AdminOperationalUnpublishedVersion,
} from '../types/admin-operational-version';
import type { AdminOperationalDownloadPurpose } from '../types/admin-operational-document';
import type {
  CoworkerOperationalActionMode,
  CoworkerOperationalDocumentStatus,
} from '../types/coworker-operational-document';
import type { AdminOperationalUploadRecovery } from '../types/admin-operational-upload';
import type { IAdminOperationalCatalog } from './i-admin-operational-catalog';

export interface IAdminOperationalDocumentListItem {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly status: CoworkerOperationalDocumentStatus;
  readonly currentPublishedVersionId: string | null;
  readonly currentPublishedVersionNumber: number | null;
  readonly currentActionMode: CoworkerOperationalActionMode | null;
  readonly currentPublishedAt: string | null;
  readonly unpublishedVersion: AdminOperationalUnpublishedVersion | null;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminOperationalDocumentDetail {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: string;
  readonly status: CoworkerOperationalDocumentStatus;
  readonly currentPublishedVersionId: string | null;
  readonly currentPublishedVersion: AdminOperationalStoredVersion | null;
  readonly versions: readonly AdminOperationalStoredVersion[];
  readonly uploadRecovery: AdminOperationalUploadRecovery | null;
  readonly revision: number;
  readonly publishedAt: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminOperationalDashboard {
  readonly catalog: IAdminOperationalCatalog;
  readonly documents: readonly IAdminOperationalDocumentListItem[];
}

export interface IAdminOperationalVersionDownload {
  readonly download: {
    readonly documentId: string;
    readonly documentVersionId: string;
    readonly signedUrl: string;
    readonly expiresInSeconds: number;
    readonly originalFilename: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
    readonly purpose: AdminOperationalDownloadPurpose;
  };
}
