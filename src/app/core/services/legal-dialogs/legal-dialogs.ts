import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  LegalDialogContent,
  LegalDialogId,
} from '../../types/i18n/legal';

@Injectable({ providedIn: 'root' })
export class LegalDialogs {
  private readonly http = inject(HttpClient);
  private readonly appBaseHref = inject(APP_BASE_HREF, { optional: true }) ?? '/';

  private readonly baseHref = this.appBaseHref.endsWith('/')
    ? this.appBaseHref
    : `${this.appBaseHref}/`;

  private readonly cache = new Map<
    LegalDialogId,
    Promise<LegalDialogContent>
  >();

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
