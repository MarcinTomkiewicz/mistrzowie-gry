import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  IAdminOperationalCatalog,
  IAdminOperationalDashboard,
  IAdminOperationalDocumentDetail,
} from '../../interfaces/i-admin-coworker-operational-document';
import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
  AdminOperationalRequest,
  SaveAdminOperationalDocumentPayload,
} from '../../types/admin-coworker-operational-document';
import { EdgeReader } from '../../types/edge-contract';
import { Backend } from '../backend/backend';
import {
  parseAdminOperationalDashboard,
  parseAdminOperationalDetail,
  parseSavedAdminOperationalDocument,
} from './admin-coworker-operational-documents.contract';

@Injectable({ providedIn: 'root' })
export class AdminCoworkerOperationalDocuments {
  private readonly backend = inject(Backend);

  getDashboard(): Observable<IAdminOperationalDashboard> {
    return this.backend
      .invokeEdge<unknown>(COWORKER_EDGE_FUNCTION.adminOperationalDocuments, {
        method: 'GET',
      })
      .pipe(map(parseAdminOperationalDashboard));
  }

  getDocumentDetail(
    documentId: string,
    catalog: IAdminOperationalCatalog,
  ): Observable<IAdminOperationalDocumentDetail> {
    return this.invokeAction(
      {
        action: ADMIN_OPERATIONAL_EDGE_ACTION.getDocumentDetail,
        documentId,
      },
      (response) =>
        parseAdminOperationalDetail(response, documentId, catalog),
    );
  }

  saveDocument(
    document: SaveAdminOperationalDocumentPayload,
    catalog: IAdminOperationalCatalog,
    previousRevision: number | null,
  ): Observable<IAdminOperationalDocumentDetail> {
    return this.invokeAction(
      {
        action: ADMIN_OPERATIONAL_EDGE_ACTION.saveDocument,
        document,
      },
      (response) =>
        parseSavedAdminOperationalDocument(
          response,
          document,
          previousRevision,
          catalog,
        ),
    );
  }

  private invokeAction<TResult>(
    request: AdminOperationalRequest,
    reader: EdgeReader<TResult>,
  ): Observable<TResult> {
    return this.backend
      .invokeEdge<unknown, AdminOperationalRequest>(
        COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
        { method: 'POST', body: request },
      )
      .pipe(map((response) => reader(response, 'response')));
  }
}
