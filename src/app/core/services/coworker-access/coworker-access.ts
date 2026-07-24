import { effect, inject, Injectable } from '@angular/core';
import { catchError, shareReplay, throwError } from 'rxjs';
import type { Observable } from 'rxjs';

import { COWORKER_EDGE_FUNCTION } from '../../configs/coworker-edge-functions.config';
import type { ICoworkerAccessContext } from '../../interfaces/i-coworker-access-context';
import { Auth } from '../auth/auth';
import { Backend } from '../backend/backend';
import { parseCoworkerAccessContext } from './coworker-access.contract';

@Injectable({ providedIn: 'root' })
export class CoworkerAccess {
  private readonly auth = inject(Auth);
  private readonly backend = inject(Backend);

  private cachedUserId: string | null = null;
  private cachedContext$: Observable<ICoworkerAccessContext> | null = null;

  constructor() {
    effect(() => {
      const userId = this.auth.userId();
      if (userId !== this.cachedUserId) {
        this.resetCache(userId);
      }
    });
  }

  getContext(): Observable<ICoworkerAccessContext> {
    const userId = this.auth.userId();
    if (userId === null) {
      this.resetCache(null);
      return this.loadContext();
    }

    if (
      this.cachedUserId === userId &&
      this.cachedContext$ !== null
    ) {
      return this.cachedContext$;
    }

    this.resetCache(userId);
    const request$ = this.loadContext().pipe(
      catchError((error: unknown) => {
        if (this.cachedContext$ === request$) {
          this.cachedContext$ = null;
        }
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cachedContext$ = request$;
    return request$;
  }

  private loadContext(): Observable<ICoworkerAccessContext> {
    return this.backend.invokeEdgeParsed(
      COWORKER_EDGE_FUNCTION.accessContext,
      { method: 'GET' },
      parseCoworkerAccessContext,
    );
  }

  private resetCache(userId: string | null): void {
    this.cachedUserId = userId;
    this.cachedContext$ = null;
  }
}
