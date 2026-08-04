import {
  AdminCoworkerSigningSourceCode,
  AdminCoworkerSigningSourceType,
  AdminCoworkerSigningSourceVersionStatus,
} from '../types/admin-coworker-signing-source';

export interface IAdminCoworkerSigningSourceCatalogItem {
  readonly id: string;
  readonly sourceType: AdminCoworkerSigningSourceType;
  readonly sourceCode: AdminCoworkerSigningSourceCode;
  readonly onboardingCaseId: string | null;
  readonly userId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly currentPublishedVersionId: string | null;
  readonly currentPublishedVersionNumber: number | null;
  readonly currentPublishedAt: string | null;
  readonly latestVersionId: string | null;
  readonly latestVersionNumber: number | null;
  readonly latestVersionStatus: AdminCoworkerSigningSourceVersionStatus | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminCoworkerSigningSourceVersion {
  readonly id: string;
  readonly sourceId: string;
  readonly versionNumber: number;
  readonly status: AdminCoworkerSigningSourceVersionStatus;
  readonly originalFilename: string;
  readonly storedFilename: string;
  readonly fileExtension: string;
  readonly declaredMimeType: string;
  readonly detectedMimeType: string | null;
  readonly expectedSizeBytes: number;
  readonly sizeBytes: number | null;
  readonly uploadedAt: string | null;
  readonly finalizedAt: string | null;
  readonly publishedAt: string | null;
  readonly supersededAt: string | null;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface IAdminCoworkerSigningSourceDetail
  extends IAdminCoworkerSigningSourceCatalogItem {
  readonly versions: readonly IAdminCoworkerSigningSourceVersion[];
}

export interface IAdminCoworkerSigningSourceSignedUpload {
  readonly token: string;
  readonly signedUrl: string;
  readonly expiresAt: string;
}

export interface IAdminCoworkerSigningSourceUploadReservation {
  readonly upload: {
    readonly sourceId: string;
    readonly sourceCreated: boolean;
    readonly sourceVersionId: string;
    readonly versionNumber: number;
    readonly uploadSessionId: string;
    readonly originalFilename: string;
    readonly storedFilename: string;
    readonly declaredMimeType: string;
    readonly expectedSizeBytes: number;
  };
  readonly signedUpload: IAdminCoworkerSigningSourceSignedUpload;
}

export interface IAdminCoworkerSigningSourceRecoveredUpload {
  readonly upload: {
    readonly sourceId: string;
    readonly sourceVersionId: string;
    readonly uploadSessionId: string;
    readonly expectedSizeBytes: number;
    readonly expectedMimeType: string;
  };
  readonly signedUpload: IAdminCoworkerSigningSourceSignedUpload;
}

export interface IAdminCoworkerSigningSourceUploadFinalization {
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly versionNumber: number;
  readonly uploadSessionId: string;
  readonly sourceVersionStatus: 'ready';
  readonly detectedMimeType: string;
  readonly sizeBytes: number;
  readonly finalizedAt: string;
}

export interface IAdminCoworkerSigningSourceUploadCancellation {
  readonly uploadSessionId: string;
  readonly cancelled: true;
  readonly cleanupStatus: 'completed';
  readonly cleanupCompletedAt: string | null;
}

export interface IAdminCoworkerSigningSourcePublishResult {
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly sourceCode: AdminCoworkerSigningSourceCode;
  readonly versionNumber: number;
  readonly status: 'published';
  readonly publishedAt: string;
  readonly supersededVersionId: string | null;
  readonly idempotent: boolean;
}

export interface IAdminCoworkerSigningSourceDownload {
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly sourceCode: AdminCoworkerSigningSourceCode;
  readonly signedUrl: string;
  readonly expiresInSeconds: number;
  readonly originalFilename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
}
