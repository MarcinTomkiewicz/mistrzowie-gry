import { inject, Injectable } from '@angular/core';
import { defer, map, Observable } from 'rxjs';

import {
  ISignedStorageUpload,
  ISignedStorageUrlUpload,
} from '../../interfaces/i-storage';
import { Supabase } from '../supabase/supabase';

@Injectable({ providedIn: 'root' })
export class SignedStorage {
  private readonly supabase = inject(Supabase).client();

  upload(request: ISignedStorageUpload): Observable<void> {
    return defer(() =>
      this.supabase.storage
        .from(request.bucket)
        .uploadToSignedUrl(request.path, request.token, request.file, {
          contentType: request.contentType,
        }),
    ).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }

        return void 0;
      }),
    );
  }

  uploadSignedUrl(request: ISignedStorageUrlUpload): Observable<void> {
    return defer(() => this.upload({
      bucket: request.bucket,
      path: this.readSignedUploadPath(request),
      token: request.token,
      file: request.file,
      contentType: request.contentType,
    }));
  }

  private readSignedUploadPath(request: ISignedStorageUrlUpload): string {
    const url = new URL(request.signedUrl);
    const marker = `/object/upload/sign/${request.bucket}/`;
    const markerIndex = url.pathname.indexOf(marker);
    const path = markerIndex === -1
      ? ''
      : decodeURIComponent(url.pathname.slice(markerIndex + marker.length));

    if (path === '' || url.searchParams.get('token') !== request.token) {
      throw new TypeError('Invalid signed storage upload URL.');
    }
    return path;
  }
}
