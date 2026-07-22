import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  IAdminOperationalCatalog,
} from '../../interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDashboard,
  IAdminOperationalDocumentDetail,
} from '../../interfaces/i-admin-operational-document';
import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
  type AdminOperationalRequest,
  type SaveAdminOperationalDocumentPayload,
} from '../../types/admin-operational-document';
import type {
  AdminOperationalFinalizeContext,
  AdminOperationalUploadReservationResult,
  ReserveAdminOperationalUploadPayload,
} from '../../types/admin-operational-upload';
import type {
  AdminOperationalStoredVersion,
  ConfigureAdminOperationalVersionPayload,
} from '../../types/admin-operational-version';
import type { EdgeReader } from '../../types/edge-contract';
import {
  parseConfiguration,
} from '../../contracts/admin-operational-documents/configuration.contract';
import {
  parseDashboard,
  parseDetail,
  parseSavedDocument,
} from '../../contracts/admin-operational-documents/document.contract';
import {
  parseCancellation,
  parseFinalization,
  parseReservation,
} from '../../contracts/admin-operational-documents/upload.contract';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminCoworkerOperationalDocuments {
  private readonly backend = inject(Backend);

  getDashboard(): Observable<IAdminOperationalDashboard> {
    return this.backend
      .invokeEdge<unknown>(COWORKER_EDGE_FUNCTION.adminOperationalDocuments, {
        method: 'GET',
      })
      .pipe(map(parseDashboard));
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
        parseDetail(response, documentId, catalog),
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
        parseSavedDocument(
          response,
          document,
          previousRevision,
          catalog,
        ),
    );
  }

  reserveUpload(
    upload: ReserveAdminOperationalUploadPayload,
  ): Observable<AdminOperationalUploadReservationResult> {
    return this.invokeAction(
      { action: ADMIN_OPERATIONAL_EDGE_ACTION.reserveUpload, upload },
      (response) => parseReservation(response, upload),
    );
  }

  finalizeUpload(
    context: AdminOperationalFinalizeContext,
  ): Observable<AdminOperationalStoredVersion> {
    const uploadSessionId = context.kind === 'reservation'
      ? context.reservation.upload.uploadSessionId
      : context.recovery.uploadSessionId;
    return this.invokeAction(
      {
        action: ADMIN_OPERATIONAL_EDGE_ACTION.finalizeUpload,
        uploadSessionId,
      },
      (response) =>
        parseFinalization(response, context),
    );
  }

  cancelUpload(uploadSessionId: string): Observable<void> {
    return this.invokeAction(
      {
        action: ADMIN_OPERATIONAL_EDGE_ACTION.cancelUpload,
        uploadSessionId,
      },
      (response) =>
        parseCancellation(response, uploadSessionId),
    );
  }

  configureVersion(
    configuration: ConfigureAdminOperationalVersionPayload,
    source: AdminOperationalStoredVersion,
  ): Observable<AdminOperationalStoredVersion> {
    return this.invokeAction(
      {
        action: ADMIN_OPERATIONAL_EDGE_ACTION.configureVersion,
        configuration,
      },
      (response) =>
        parseConfiguration(response, configuration, source),
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
