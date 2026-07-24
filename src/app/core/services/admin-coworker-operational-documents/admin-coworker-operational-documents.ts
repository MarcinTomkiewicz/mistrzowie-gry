import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  IAdminOperationalCatalog,
} from '../../interfaces/i-admin-operational-catalog';
import {
  IAdminOperationalDashboard,
  IAdminOperationalDocumentDetail,
  IAdminOperationalVersionDownload,
} from '../../interfaces/i-admin-operational-document';
import type { IAdminOperationalAssignmentListItem } from '../../interfaces/i-admin-operational-assignment';
import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
  type AdminOperationalRequest,
  type DownloadAdminOperationalVersionRequest,
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
import {
  parseAssignmentList,
  parseWaivedAssignment,
} from '../../contracts/admin-operational-documents/assignment.contract';
import {
  parseArchivedDocument,
  parsePublishedVersion,
  parseVersionDownload,
} from '../../contracts/admin-operational-documents/lifecycle.contract';
import type { ICoworkerOperationalAssignment } from '../../interfaces/i-coworker-operational-document';
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
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_OPERATIONAL_EDGE_ACTION.getDocumentDetail, documentId } satisfies AdminOperationalRequest,
      },
      (response) => parseDetail(response, documentId, catalog),
    );
  }

  saveDocument(
    document: SaveAdminOperationalDocumentPayload,
    catalog: IAdminOperationalCatalog,
    previousRevision: number | null,
  ): Observable<IAdminOperationalDocumentDetail> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_OPERATIONAL_EDGE_ACTION.saveDocument, document } satisfies AdminOperationalRequest,
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
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_OPERATIONAL_EDGE_ACTION.reserveUpload, upload } satisfies AdminOperationalRequest,
      },
      (response) => parseReservation(response, upload),
    );
  }

  finalizeUpload(
    context: AdminOperationalFinalizeContext,
  ): Observable<AdminOperationalStoredVersion> {
    const uploadSessionId = context.kind === 'reservation'
      ? context.reservation.upload.uploadSessionId
      : context.recovery.uploadSessionId;
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_OPERATIONAL_EDGE_ACTION.finalizeUpload, uploadSessionId } satisfies AdminOperationalRequest,
      },
      (response) => parseFinalization(response, context),
    );
  }

  cancelUpload(uploadSessionId: string): Observable<void> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_OPERATIONAL_EDGE_ACTION.cancelUpload, uploadSessionId } satisfies AdminOperationalRequest,
      },
      (response) => parseCancellation(response, uploadSessionId),
    );
  }

  configureVersion(
    configuration: ConfigureAdminOperationalVersionPayload,
    source: AdminOperationalStoredVersion,
  ): Observable<AdminOperationalStoredVersion> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: { action: ADMIN_OPERATIONAL_EDGE_ACTION.configureVersion, configuration } satisfies AdminOperationalRequest,
      },
      (response) => parseConfiguration(response, configuration, source),
    );
  }

  publishVersion(
    documentVersionId: string,
    catalog: IAdminOperationalCatalog,
  ): Observable<void> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_OPERATIONAL_EDGE_ACTION.publishVersion,
          documentVersionId,
        } satisfies AdminOperationalRequest,
      },
      (response) =>
        parsePublishedVersion(response, documentVersionId, catalog),
    );
  }

  getAssignmentList(
    documentVersionId: string,
  ): Observable<IAdminOperationalAssignmentListItem[]> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_OPERATIONAL_EDGE_ACTION.getAssignmentList,
          documentVersionId,
        } satisfies AdminOperationalRequest,
      },
      (response) => parseAssignmentList(response, documentVersionId),
    );
  }

  waiveAssignment(
    assignmentId: string,
    reason: string,
  ): Observable<ICoworkerOperationalAssignment> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_OPERATIONAL_EDGE_ACTION.waiveAssignment,
          assignmentId,
          reason,
        } satisfies AdminOperationalRequest,
      },
      (response) => parseWaivedAssignment(response, assignmentId),
    );
  }

  archiveDocument(
    documentId: string,
    catalog: IAdminOperationalCatalog,
  ): Observable<IAdminOperationalDocumentDetail> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_OPERATIONAL_EDGE_ACTION.archiveDocument,
          documentId,
        } satisfies AdminOperationalRequest,
      },
      (response) => parseArchivedDocument(response, documentId, catalog),
    );
  }

  downloadDocumentVersion(
    request: DownloadAdminOperationalVersionRequest,
  ): Observable<IAdminOperationalVersionDownload> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminOperationalDocuments,
      {
        method: 'POST',
        body: {
          action: ADMIN_OPERATIONAL_EDGE_ACTION.downloadDocumentVersion,
          ...request,
        } satisfies AdminOperationalRequest,
      },
      (response) => parseVersionDownload(response, request),
    );
  }
}
