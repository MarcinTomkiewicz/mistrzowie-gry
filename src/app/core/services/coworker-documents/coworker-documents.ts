import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  ICoworkerDocumentPortalResponse,
  ICoworkerDocumentVersionDownloadRequest,
  ICoworkerDocumentVersionDownloadResponse,
} from '../../interfaces/i-coworker-document';
import { COWORKER_DOCUMENT_DOWNLOAD_ACTION } from '../../types/coworker-document';
import { Backend } from '../backend/backend';
import {
  parseCoworkerDocumentPortalResponse,
  parseCoworkerDocumentVersionDownloadResponse,
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

  downloadDocumentVersion(
    documentVersionId: string,
  ): Observable<ICoworkerDocumentVersionDownloadResponse> {
    const request: ICoworkerDocumentVersionDownloadRequest = {
      action: COWORKER_DOCUMENT_DOWNLOAD_ACTION,
      documentVersionId,
    };

    return this.backend
      .invokeEdge<unknown, ICoworkerDocumentVersionDownloadRequest>(
        COWORKER_EDGE_FUNCTION.documents,
        { method: 'POST', body: request },
      )
      .pipe(map(parseCoworkerDocumentVersionDownloadResponse));
  }
}
