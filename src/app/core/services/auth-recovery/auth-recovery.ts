import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import type { AuthError } from '@supabase/supabase-js';
import { catchError, from, map, Observable, throwError } from 'rxjs';

import { Supabase } from '../supabase/supabase';
import { mapAuthError } from '../../utils/auth-error';

const RESET_PASSWORD_PATH = '/auth/reset-password';

@Injectable({ providedIn: 'root' })
export class AuthRecovery {
  private readonly document = inject(DOCUMENT);
  private readonly supabase = inject(Supabase).client();

  requestPasswordReset(email: string): Observable<void> {
    const redirectTo = new URL(
      RESET_PASSWORD_PATH,
      this.document.location.origin,
    ).toString();

    return this.complete(
      this.supabase.auth.resetPasswordForEmail(email, { redirectTo }),
    );
  }

  resendSignupConfirmation(email: string): Observable<void> {
    return this.complete(this.supabase.auth.resend({ type: 'signup', email }));
  }

  updatePassword(password: string): Observable<void> {
    return this.complete(this.supabase.auth.updateUser({ password }));
  }

  private complete(
    request: Promise<{ error: AuthError | null }>,
  ): Observable<void> {
    return from(request).pipe(
      map(({ error }) => {
        if (error) {
          throw error;
        }
      }),
      catchError((error) => throwError(() => mapAuthError(error))),
    );
  }
}
