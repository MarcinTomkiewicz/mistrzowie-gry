import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import type {
  IAcknowledgeCoworkerDocumentsResult,
  ICoworkerDocumentDownload,
  ICoworkerDocumentEdgeResponse,
  ICoworkerDocumentPortal,
  IRegisterCoworkerSignedSubmissionResult,
} from '../../interfaces/i-coworker-onboarding';
import type { CoworkerDocumentDownloadTarget } from '../../types/coworker-onboarding';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class CoworkerOnboarding {
  private readonly backend = inject(Backend);

  getPortal(): Observable<ICoworkerDocumentPortal> {
    return this.invoke({ action: 'getPortal' });
  }

  uploadSignedDocument(
    assignmentId: string,
    file: File,
  ): Observable<
    Omit<
      IRegisterCoworkerSignedSubmissionResult,
      'signed_storage_path' | 'replaced_signed_storage_path'
    >
  > {
    const body = new FormData();
    body.append('action', 'uploadSignedDocument');
    body.append('assignment_id', assignmentId);
    body.append('signed_declared', 'true');
    body.append('file', file);
    return this.invoke(body);
  }

  acknowledgeSharedDocuments(
    assignmentIds: readonly string[],
  ): Observable<IAcknowledgeCoworkerDocumentsResult> {
    return this.invoke({
      action: 'acknowledgeSharedDocuments',
      assignment_ids: assignmentIds,
    });
  }

  getDownload(
    assignmentId: string,
    target: CoworkerDocumentDownloadTarget,
  ): Observable<ICoworkerDocumentDownload> {
    return this.invoke({
      action: 'getDownloadUrl',
      assignment_id: assignmentId,
      target,
    });
  }

  private invoke<TResult, TBody>(body: TBody): Observable<TResult> {
    return this.backend
      .invokeEdge<ICoworkerDocumentEdgeResponse<TResult>, TBody>(
        COWORKER_EDGE_FUNCTION.documents,
        { method: 'POST', body },
      )
      .pipe(map((response) => response.data));
  }
}
