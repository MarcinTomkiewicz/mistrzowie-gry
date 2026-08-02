import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  createNotificationReadReader,
  createSubmitDocumentReader,
  createWithdrawDocumentReader,
  ICoworkerNotificationReadResult,
} from '../../contracts/coworker-documents/coworker-document-actions.contract';
import {
  createDeletionCapabilitiesResponseReader,
  createDocumentDeletionReader,
  createDocumentVersionDeletionReader,
} from '../../contracts/coworker-documents/coworker-document-deletion.contract';
import {
  createCancelUploadReader,
  createFinalizeUploadReader,
  createRecoverUploadReader,
  createReserveUploadReader,
} from '../../contracts/coworker-documents/coworker-document-upload.contract';
import {
  createDocumentDownloadResponseReader,
  parseCoworkerDocumentPortalResponse,
} from '../../contracts/coworker-documents/coworker-documents.contract';
import {
  ICoworkerDocument,
  ICoworkerDocumentPortalResponse,
  ICoworkerVersionDownload,
} from '../../interfaces/i-coworker-document';
import {
  ICoworkerDocumentDeletionCapabilities,
  ICoworkerDocumentDeletionResult,
  ICoworkerDocumentVersionDeletionResult,
} from '../../interfaces/i-coworker-document-deletion';
import {
  ICoworkerRecoveredUpload,
  ICoworkerUploadCancellationResult,
  ICoworkerUploadFinalizationResult,
  ICoworkerUploadReservation,
} from '../../interfaces/i-coworker-document-upload';
import {
  COWORKER_DOCUMENT_ACTION,
  CoworkerDocumentActionRequest,
} from '../../types/coworker-document';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class CoworkerDocuments {
  private readonly backend = inject(Backend);

  getPortal(): Observable<ICoworkerDocumentPortalResponse> {
    return this.backend
      .invokeEdge<unknown>(COWORKER_EDGE_FUNCTION.documents, { method: 'GET' })
      .pipe(map(parseCoworkerDocumentPortalResponse));
  }

  reserveUpload(
    request: Extract<
      CoworkerDocumentActionRequest,
      { action: typeof COWORKER_DOCUMENT_ACTION.reserveUpload }
    >,
  ): Observable<ICoworkerUploadReservation> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createReserveUploadReader(request),
    );
  }

  recoverUpload(uploadSessionId: string): Observable<ICoworkerRecoveredUpload> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.recoverUpload,
      uploadSessionId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createRecoverUploadReader(uploadSessionId),
    );
  }

  finalizeUpload(
    uploadSessionId: string,
  ): Observable<ICoworkerUploadFinalizationResult> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.finalizeUpload,
      uploadSessionId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createFinalizeUploadReader(uploadSessionId),
    );
  }

  cancelUpload(
    uploadSessionId: string,
  ): Observable<ICoworkerUploadCancellationResult> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.cancelUpload,
      uploadSessionId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createCancelUploadReader(uploadSessionId),
    );
  }

  submitDocument(
    documentId: string,
    documentVersionId: string,
  ): Observable<ICoworkerDocument> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.submitDocument,
      documentId,
      documentVersionId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createSubmitDocumentReader(documentId, documentVersionId),
    );
  }

  withdrawDocument(documentId: string): Observable<ICoworkerDocument> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.withdrawDocument,
      documentId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createWithdrawDocumentReader(documentId),
    );
  }

  downloadDocumentVersion(
    documentVersionId: string,
  ): Observable<ICoworkerVersionDownload> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
      documentVersionId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createDocumentDownloadResponseReader(documentVersionId),
    );
  }

  markNotificationRead(
    notificationId: string,
  ): Observable<ICoworkerNotificationReadResult> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.markNotificationRead,
      notificationId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createNotificationReadReader(notificationId),
    );
  }

  getDeletionCapabilities(
    documentId: string,
  ): Observable<ICoworkerDocumentDeletionCapabilities> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.getDeletionCapabilities,
      documentId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createDeletionCapabilitiesResponseReader(documentId),
    );
  }

  deleteDocumentVersion(
    documentId: string,
    documentVersionId: string,
  ): Observable<ICoworkerDocumentVersionDeletionResult> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.deleteDocumentVersion,
      documentId,
      documentVersionId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createDocumentVersionDeletionReader(documentId, documentVersionId),
    );
  }

  deleteDocument(documentId: string): Observable<ICoworkerDocumentDeletionResult> {
    const request = {
      action: COWORKER_DOCUMENT_ACTION.deleteDocument,
      documentId,
    } satisfies CoworkerDocumentActionRequest;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.documents,
      { method: 'POST', body: request },
      createDocumentDeletionReader(documentId),
    );
  }
}
