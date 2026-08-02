import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, switchMap } from 'rxjs';

import { COWORKER_DOCUMENTS_STORAGE } from '../../configs/coworker-documents.config';
import {
  ICoworkerUploadCancellationResult,
  ICoworkerUploadReservation,
} from '../../interfaces/i-coworker-document-upload';
import { CoworkerDocuments } from '../coworker-documents/coworker-documents';
import { SignedStorage } from '../signed-storage/signed-storage';

@Injectable({ providedIn: 'root' })
export class CoworkerDocumentUploadOrchestrator {
  private readonly coworkerDocuments = inject(CoworkerDocuments);
  private readonly signedStorage = inject(SignedStorage);

  transfer(
    file: File,
    contentType: string,
    reservation: ICoworkerUploadReservation,
  ): Observable<ICoworkerUploadReservation> {
    const upload = (token: string) => this.signedStorage.upload({
      bucket: COWORKER_DOCUMENTS_STORAGE.bucket,
      path: reservation.signedUpload.path,
      token,
      file,
      contentType,
    });

    return upload(reservation.signedUpload.token).pipe(
      catchError(() => this.coworkerDocuments
        .recoverUpload(reservation.upload.uploadSessionId)
        .pipe(switchMap((recovered) => upload(recovered.signedUpload.token)))),
      map(() => reservation),
    );
  }

  cancel(
    uploadSessionId: string,
  ): Observable<ICoworkerUploadCancellationResult> {
    return this.coworkerDocuments.cancelUpload(uploadSessionId);
  }
}
