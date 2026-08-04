import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import {
  createDownloadSigningSourceVersionReader,
  createPublishSigningSourceVersionReader,
} from '../../contracts/admin-coworker-documents/admin-coworker-signing-source-actions.contract';
import {
  createSigningSourceDetailReader,
  signingSourceCatalogResponseReader,
} from '../../contracts/admin-coworker-documents/admin-coworker-signing-source-catalog.contract';
import {
  createCancelSigningSourceUploadReader,
  createFinalizeSigningSourceUploadReader,
  createRecoverSigningSourceUploadReader,
  createReserveSigningSourceUploadReader,
} from '../../contracts/admin-coworker-documents/admin-coworker-signing-source-upload.contract';
import {
  IAdminCoworkerSigningSourceCatalogItem,
  IAdminCoworkerSigningSourceDetail,
  IAdminCoworkerSigningSourceDownload,
  IAdminCoworkerSigningSourcePublishResult,
  IAdminCoworkerSigningSourceRecoveredUpload,
  IAdminCoworkerSigningSourceUploadCancellation,
  IAdminCoworkerSigningSourceUploadFinalization,
  IAdminCoworkerSigningSourceUploadReservation,
} from '../../interfaces/i-admin-coworker-signing-source';
import {
  ADMIN_COWORKER_SIGNING_SOURCE_ACTION,
  AdminCoworkerSigningSourceActionRequest,
  AdminCoworkerSigningSourceUploadPayload,
} from '../../types/admin-coworker-signing-source';
import { EdgeReader } from '../../types/edge-contract';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class AdminCoworkerSigningSources {
  private readonly backend = inject(Backend);

  getCatalog(): Observable<readonly IAdminCoworkerSigningSourceCatalogItem[]> {
    return this.invoke(
      { action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.getCatalog },
      signingSourceCatalogResponseReader,
    );
  }

  getDetail(sourceId: string): Observable<IAdminCoworkerSigningSourceDetail> {
    return this.invoke(
      { action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.getDetail, sourceId },
      createSigningSourceDetailReader(sourceId),
    );
  }

  reserveUpload(
    upload: AdminCoworkerSigningSourceUploadPayload,
  ): Observable<IAdminCoworkerSigningSourceUploadReservation> {
    return this.invoke(
      { action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.reserveUpload, upload },
      createReserveSigningSourceUploadReader(upload),
    );
  }

  recoverUpload(
    uploadSessionId: string,
  ): Observable<IAdminCoworkerSigningSourceRecoveredUpload> {
    return this.invoke(
      {
        action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.recoverUpload,
        uploadSessionId,
      },
      createRecoverSigningSourceUploadReader(uploadSessionId),
    );
  }

  finalizeUpload(
    uploadSessionId: string,
  ): Observable<IAdminCoworkerSigningSourceUploadFinalization> {
    return this.invoke(
      {
        action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.finalizeUpload,
        uploadSessionId,
      },
      createFinalizeSigningSourceUploadReader(uploadSessionId),
    );
  }

  cancelUpload(
    uploadSessionId: string,
  ): Observable<IAdminCoworkerSigningSourceUploadCancellation> {
    return this.invoke(
      {
        action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.cancelUpload,
        uploadSessionId,
      },
      createCancelSigningSourceUploadReader(uploadSessionId),
    );
  }

  publishVersion(
    sourceVersionId: string,
  ): Observable<IAdminCoworkerSigningSourcePublishResult> {
    return this.invoke(
      {
        action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.publishVersion,
        sourceVersionId,
      },
      createPublishSigningSourceVersionReader(sourceVersionId),
    );
  }

  downloadVersion(
    sourceVersionId: string,
  ): Observable<IAdminCoworkerSigningSourceDownload> {
    return this.invoke(
      {
        action: ADMIN_COWORKER_SIGNING_SOURCE_ACTION.downloadVersion,
        sourceVersionId,
      },
      createDownloadSigningSourceVersionReader(sourceVersionId),
    );
  }

  private invoke<TResult>(
    request: AdminCoworkerSigningSourceActionRequest,
    reader: EdgeReader<TResult>,
  ): Observable<TResult> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.adminDocuments,
      { method: 'POST', body: request },
      reader,
    );
  }
}
