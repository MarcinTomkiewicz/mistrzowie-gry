import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, throwError } from 'rxjs';

import type { LegalDialogContent } from '../../types/i18n/legal';
import type { LegalDialogId } from '../../types/legal-dialog';

@Injectable({ providedIn: 'root' })
export class LegalDialogs {
  private readonly activeDialogState = signal<LegalDialogId | null>(null);
  private readonly contentState = signal<LegalDialogContent | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal(false);

  readonly activeDialog = this.activeDialogState.asReadonly();
  readonly content = this.contentState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  private readonly http = inject(HttpClient);
  private readonly appBaseHref = inject(APP_BASE_HREF, { optional: true }) ?? '/';

  private readonly baseHref = this.appBaseHref.endsWith('/')
    ? this.appBaseHref
    : `${this.appBaseHref}/`;

  private readonly cache = new Map<
    LegalDialogId,
    Observable<LegalDialogContent>
  >();

  open(dialog: LegalDialogId): void {
    this.activeDialogState.set(dialog);
    this.contentState.set(null);
    this.errorState.set(false);
    this.loadingState.set(true);
    this.load(dialog).pipe(finalize(() => {
      if (this.activeDialog() === dialog) this.loadingState.set(false);
    })).subscribe({
      next: content => {
        if (this.activeDialog() === dialog) this.contentState.set(content);
      },
      error: () => {
        if (this.activeDialog() === dialog) this.errorState.set(true);
      },
    });
  }

  close(): void {
    this.activeDialogState.set(null);
    this.contentState.set(null);
    this.loadingState.set(false);
    this.errorState.set(false);
  }

  load(dialog: LegalDialogId): Observable<LegalDialogContent> {
    const cached = this.cache.get(dialog);
    if (cached) {
      return cached;
    }

    const request = this.http.get<LegalDialogContent>(
      `${this.baseHref}assets/i18n/pl/legal/${dialog}.json`,
    ).pipe(
      catchError((error: unknown) => {
        this.cache.delete(dialog);
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(dialog, request);
    return request;
  }
}
