import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  ICoworkerDocumentPortalResponse,
  ICoworkerUploadReservation,
  ICoworkerVersionDownload,
} from '../../interfaces/i-coworker-document';
import {
  COWORKER_DOCUMENT_ACTION,
  CoworkerDocumentActionRequest,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import { Backend } from '../backend/backend';
import {
  cancelUploadReader,
  createCoworkerDocumentSuccessReader,
  finalizeUploadReader,
  reserveUploadReader,
} from './coworker-document-actions.contract';
import {
  parseDocumentDownloadResponse,
  parseCoworkerDocumentPortalResponse,
} from './coworker-documents.contract';

@Injectable({ providedIn: 'root' })
export class CoworkerDocuments {
  private readonly backend = inject(Backend);

  getPortal(): Observable<ICoworkerDocumentPortalResponse> {
    return this.backend
      .invokeEdge<unknown>(COWORKER_EDGE_FUNCTION.documents, {
        method: 'GET',
      })
      .pipe(map(parseCoworkerDocumentPortalResponse));
  }

  reserveUpload(
    request: Extract<
      CoworkerDocumentActionRequest,
      { action: typeof COWORKER_DOCUMENT_ACTION.reserveUpload }
    >,
  ): Observable<ICoworkerUploadReservation> {
    return this.invokeAction(
      request,
      reserveUploadReader,
    );
  }

  finalizeUpload(uploadSessionId: string): Observable<void> {
    return this.invokeAction(
      {
        action: COWORKER_DOCUMENT_ACTION.finalizeUpload,
        uploadSessionId,
      },
      finalizeUploadReader,
    );
  }

  cancelUpload(uploadSessionId: string): Observable<void> {
    return this.invokeAction(
      {
        action: COWORKER_DOCUMENT_ACTION.cancelUpload,
        uploadSessionId,
      },
      cancelUploadReader,
    );
  }

  submitDocument(documentId: string): Observable<void> {
    return this.invokeAction(
      {
        action: COWORKER_DOCUMENT_ACTION.submitDocument,
        documentId,
      },
      createCoworkerDocumentSuccessReader(
        COWORKER_DOCUMENT_ACTION.submitDocument,
      ),
    );
  }

  withdrawDocument(documentId: string): Observable<void> {
    return this.invokeAction(
      {
        action: COWORKER_DOCUMENT_ACTION.withdrawDocument,
        documentId,
      },
      createCoworkerDocumentSuccessReader(
        COWORKER_DOCUMENT_ACTION.withdrawDocument,
      ),
    );
  }

  downloadDocumentVersion(
    documentVersionId: string,
  ): Observable<ICoworkerVersionDownload> {
    const request: Extract<
      CoworkerDocumentActionRequest,
      { action: typeof COWORKER_DOCUMENT_ACTION.downloadDocumentVersion }
    > = {
      action: COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
      documentVersionId,
    };

    return this.invokeAction(
      request,
      parseDocumentDownloadResponse,
    );
  }

  markNotificationRead(notificationId: string): Observable<void> {
    return this.invokeAction(
      {
        action: COWORKER_DOCUMENT_ACTION.markNotificationRead,
        notificationId,
      },
      createCoworkerDocumentSuccessReader(
        COWORKER_DOCUMENT_ACTION.markNotificationRead,
      ),
    );
  }

  private invokeAction<TResponse>(
    request: CoworkerDocumentActionRequest,
    reader: EdgeReader<TResponse>,
  ): Observable<TResponse> {
    return this.backend
      .invokeEdge<unknown, CoworkerDocumentActionRequest>(COWORKER_EDGE_FUNCTION.documents, {
        method: 'POST',
        body: request,
      })
      .pipe(map((response) => reader(response, 'response')));
  }
}
