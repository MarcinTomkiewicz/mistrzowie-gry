// path: src/app/core/loaders/transloco.loader.ts
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  makeStateKey,
  TransferState,
} from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const TRANSLATION_CACHE_BUSTER = Date.now().toString(36);

/**
 * Struktura plików:
 *   /assets/i18n/<lang>/<namespace>.json
 *
 * Transloco (scopes) wywołuje loader jako: "<namespace>/<lang>"
 * np. "about/pl", "common/pl".
 *
 * Mapowanie:
 *   "about/pl"  -> /assets/i18n/pl/about.json
 *   "common/pl" -> /assets/i18n/pl/common.json
 *
 * Jeśli dostaniemy root lang (np. "pl") — fallbackujemy do common:
 *   "pl" -> /assets/i18n/pl/common.json
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  getTranslation(langOrScopeLang: string): Observable<Translation> {
    const resolvedUrl = this.resolveUrl(langOrScopeLang);
    const stateKey = makeStateKey<Translation>(
      `transloco:${resolvedUrl}`,
    );

    if (
      isPlatformBrowser(this.platformId) &&
      this.transferState.hasKey(stateKey)
    ) {
      const translation = this.transferState.get(stateKey, {});
      this.transferState.remove(stateKey);
      return of(translation);
    }

    const url = this.withCacheBuster(resolvedUrl);

    return this.http.get<Translation>(url).pipe(
      tap((translation) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(stateKey, translation);
        }
      }),
    );
  }

  private resolveUrl(langOrScopeLang: string): string {
    // scope/lang: bierzemy ostatni segment jako lang, reszta jako namespace
    if (langOrScopeLang.includes('/')) {
      const parts = langOrScopeLang.split('/').filter(Boolean);
      const lang = parts[parts.length - 1] ?? 'pl';
      const namespace = parts.slice(0, -1).join('/');

      // minimalna obrona: jeśli namespace pusty, traktujemy jak common
      const safeNamespace = namespace || 'common';
      return `/assets/i18n/${lang}/${safeNamespace}.json`;
    }

    // root lang
    const lang = langOrScopeLang || 'pl';
    return `/assets/i18n/${lang}/common.json`;
  }

  private withCacheBuster(url: string): string {
    const separator = url.includes('?') ? '&' : '?';

    return `${url}${separator}v=${TRANSLATION_CACHE_BUSTER}`;
  }
}
