import { inject, Injectable } from '@angular/core';
import { defer, map, Observable } from 'rxjs';

import { ISignedStorageUpload } from '../../interfaces/i-storage';
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
}
