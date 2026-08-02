import {
  ICoworkerDocument,
} from './i-coworker-document';
import { SignatureDeclarationType } from '../types/coworker-document';

export interface ICoworkerUploadReservation {
  readonly upload: {
    readonly documentId: string;
    readonly documentCreated: boolean;
    readonly documentVersionId: string;
    readonly versionNumber: number;
    readonly uploadSessionId: string;
    readonly originalFilename: string;
    readonly storedFilename: string;
    readonly declaredMimeType: string;
    readonly expectedSizeBytes: number;
    readonly signatureDeclarationType: SignatureDeclarationType;
  };
  readonly signedUpload: {
    readonly path: string;
    readonly token: string;
    readonly signedUrl: string;
    readonly expiresAt: string;
  };
}

export interface ICoworkerRecoveredUpload {
  readonly upload: {
    readonly documentId: string;
    readonly documentVersionId: string;
    readonly uploadSessionId: string;
    readonly expectedSizeBytes: number;
    readonly expectedMimeType: string;
  };
  readonly signedUpload: {
    readonly token: string;
    readonly signedUrl: string;
    readonly expiresAt: string;
  };
}

export interface ICoworkerUploadFinalizationResult {
  readonly uploadSessionId: string;
  readonly finalized: true;
  readonly document: ICoworkerDocument;
}

export interface ICoworkerUploadCancellationResult {
  readonly uploadSessionId: string;
  readonly cancelled: true;
  readonly cleanupStatus: 'completed' | 'failed';
  readonly cleanupCompletedAt?: string | null;
}
