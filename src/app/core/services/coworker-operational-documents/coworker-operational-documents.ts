import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import { ICoworkerOperationalAssignment, ICoworkerOperationalPortal } from '../../interfaces/i-coworker-operational-document';
import { ICoworkerVersionDownload } from '../../interfaces/i-coworker-document';
import {
  COWORKER_OPERATIONAL_EDGE_ACTION,
  CoworkerOperationalRequest,
  RecordCoworkerOperationalActionRequest,
} from '../../types/coworker-operational-document';
import { EdgeReader } from '../../types/edge-contract';
import { createEdgeSuccessReader } from '../../utils/edge-contract';
import { Backend } from '../backend/backend';
import {
  parseCoworkerOperationalAssignment,
  parseCoworkerOperationalDownload,
  parseCoworkerOperationalPortal,
} from './coworker-operational-documents.contract';

@Injectable({ providedIn: 'root' })
export class CoworkerOperationalDocuments {
  private readonly backend = inject(Backend);

  getPortal(): Observable<ICoworkerOperationalPortal> {
    return this.backend
      .invokeEdge<unknown>(COWORKER_EDGE_FUNCTION.operationalDocuments, {
        method: 'GET',
      })
      .pipe(map(parseCoworkerOperationalPortal));
  }

  recordAction(
    request: RecordCoworkerOperationalActionRequest,
  ): Observable<ICoworkerOperationalAssignment> {
    return this.invokeAction(
      request,
      (response) =>
        parseCoworkerOperationalAssignment(response, request.assignmentId),
    );
  }

  downloadDocumentVersion(
    documentVersionId: string,
  ): Observable<ICoworkerVersionDownload> {
    return this.invokeAction(
      {
        action: COWORKER_OPERATIONAL_EDGE_ACTION.downloadDocumentVersion,
        documentVersionId,
      },
      (response) =>
        parseCoworkerOperationalDownload(response, documentVersionId),
    );
  }

  markNotificationRead(notificationId: string): Observable<void> {
    return this.invokeAction(
      {
        action: COWORKER_OPERATIONAL_EDGE_ACTION.markNotificationRead,
        notificationId,
      },
      createEdgeSuccessReader(
        COWORKER_OPERATIONAL_EDGE_ACTION.markNotificationRead,
      ),
    );
  }

  private invokeAction<TResult>(
    request: CoworkerOperationalRequest,
    reader: EdgeReader<TResult>,
  ): Observable<TResult> {
    return this.backend
      .invokeEdge<unknown, CoworkerOperationalRequest>(
        COWORKER_EDGE_FUNCTION.operationalDocuments,
        { method: 'POST', body: request },
      )
      .pipe(map((response) => reader(response, 'response')));
  }
}
