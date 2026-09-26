import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

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
    Promise<LegalDialogContent>
  >();

  async open(dialog: LegalDialogId): Promise<void> {
    this.activeDialogState.set(dialog);
    this.contentState.set(null);
    this.errorState.set(false);
    this.loadingState.set(true);
    try {
      const content = await this.load(dialog);
      if (this.activeDialog() === dialog) this.contentState.set(content);
    } catch {
      if (this.activeDialog() === dialog) this.errorState.set(true);
    } finally {
      if (this.activeDialog() === dialog) this.loadingState.set(false);
    }
  }

  close(): void {
    this.activeDialogState.set(null);
    this.contentState.set(null);
    this.loadingState.set(false);
    this.errorState.set(false);
  }

  load(dialog: LegalDialogId): Promise<LegalDialogContent> {
    const cached = this.cache.get(dialog);
    if (cached) {
      return cached;
    }

    const request = firstValueFrom(
      this.http.get<LegalDialogContent>(
        `${this.baseHref}assets/i18n/pl/legal/${dialog}.json`,
      ),
    ).catch((error: unknown) => {
      this.cache.delete(dialog);
      throw error;
    });

    this.cache.set(dialog, request);
    return request;
  }
}
