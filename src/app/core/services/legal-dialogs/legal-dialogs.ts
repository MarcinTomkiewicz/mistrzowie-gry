import { APP_BASE_HREF } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ActiveLegalDialog,
  LegalDialogsPayload,
  LegalJsonPayload,
} from '../../types/i18n/legal';

@Injectable({ providedIn: 'root' })
export class LegalDialogs {
  private readonly http = inject(HttpClient);
  private readonly appBaseHref = inject(APP_BASE_HREF, { optional: true }) ?? '/';

  private readonly baseHref = this.appBaseHref.endsWith('/')
    ? this.appBaseHref
    : `${this.appBaseHref}/`;

  private dialogsCache: LegalDialogsPayload | null = null;
  private dialogsPromise: Promise<LegalDialogsPayload> | null = null;

  async loadAll(): Promise<LegalDialogsPayload> {
    if (this.dialogsCache) {
      return this.dialogsCache;
    }

    if (!this.dialogsPromise) {
      this.dialogsPromise = firstValueFrom(
        this.http.get<LegalJsonPayload>(`${this.baseHref}assets/i18n/pl/legal.json`),
      )
        .then((payload) => {
          const dialogs = {
            terms: payload.termsDialog ?? null,
            'privacy-policy': payload.privacyPolicyDialog ?? null,
          } satisfies LegalDialogsPayload;

          this.dialogsCache = dialogs;
          return dialogs;
        })
        .catch((error: unknown) => {
          this.dialogsPromise = null;
          throw error;
        });
    }

    return this.dialogsPromise;
  }

  async load(
    dialog: Exclude<ActiveLegalDialog, null>,
  ): Promise<LegalDialogsPayload[typeof dialog]> {
    const dialogs = await this.loadAll();
    return dialogs[dialog];
  }
}
