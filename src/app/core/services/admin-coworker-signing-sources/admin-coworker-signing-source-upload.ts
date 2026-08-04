import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, switchMap, tap } from 'rxjs';

import { COWORKER_DOCUMENTS_STORAGE } from '../../configs/coworker-documents.config';
import {
  IAdminCoworkerSigningSourceUploadCancellation,
  IAdminCoworkerSigningSourceUploadReservation,
} from '../../interfaces/i-admin-coworker-signing-source';
import { assertEdgeContract } from '../../utils/edge-contract';
import { SignedStorage } from '../signed-storage/signed-storage';
import { AdminCoworkerSigningSources } from './admin-coworker-signing-sources';

@Injectable({ providedIn: 'root' })
export class AdminCoworkerSigningSourceUpload {
  private readonly signingSources = inject(AdminCoworkerSigningSources);
  private readonly signedStorage = inject(SignedStorage);

  transfer(
    file: File,
    contentType: string,
    reservation: IAdminCoworkerSigningSourceUploadReservation,
  ): Observable<IAdminCoworkerSigningSourceUploadReservation> {
    const upload = (signedUpload: typeof reservation.signedUpload) =>
      this.signedStorage.uploadSignedUrl({
        bucket: COWORKER_DOCUMENTS_STORAGE.bucket,
        signedUrl: signedUpload.signedUrl,
        token: signedUpload.token,
        file,
        contentType,
      });

    return upload(reservation.signedUpload).pipe(
      catchError(() => this.signingSources
        .recoverUpload(reservation.upload.uploadSessionId)
        .pipe(
          tap((recovery) => assertEdgeContract(
            recovery.upload.sourceId === reservation.upload.sourceId &&
              recovery.upload.sourceVersionId ===
                reservation.upload.sourceVersionId &&
              recovery.upload.expectedSizeBytes ===
                reservation.upload.expectedSizeBytes &&
              recovery.upload.expectedMimeType ===
                reservation.upload.declaredMimeType,
            'response.upload',
            'the reserved signing source upload identity and metadata',
          )),
          switchMap((recovery) => upload(recovery.signedUpload)),
        )),
      map(() => reservation),
    );
  }

  cancel(
    uploadSessionId: string,
  ): Observable<IAdminCoworkerSigningSourceUploadCancellation> {
    return this.signingSources.cancelUpload(uploadSessionId);
  }
}
