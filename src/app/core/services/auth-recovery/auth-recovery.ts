import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import type { AuthError } from '@supabase/supabase-js';
import { catchError, from, map, Observable, tap, throwError } from 'rxjs';

import { Supabase } from '../supabase/supabase';
import { AppAuthError } from '../../types/auth-error';
import { mapAuthError } from '../../utils/auth-error';

const RESET_PASSWORD_PATH = '/auth/reset-password';

@Injectable({ providedIn: 'root' })
export class AuthRecovery {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly supabase = inject(Supabase).client();
  private isRecoveryFlowActive = false;

  constructor() {
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        this.isRecoveryFlowActive = true;
      } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        this.isRecoveryFlowActive = false;
      }
    });

    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

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
    if (!this.isRecoveryFlowActive) {
      return throwError(() => new AppAuthError('session_not_found'));
    }

    return this.complete(this.supabase.auth.updateUser({ password })).pipe(
      tap(() => {
        this.isRecoveryFlowActive = false;
      }),
    );
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
