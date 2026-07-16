// path: src/app/core/loaders/transloco.loader.ts
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
  makeStateKey,
  PLATFORM_ID,
  TransferState,
} from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

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
    const translationPath = this.resolvePath(langOrScopeLang);
    const stateKey = makeStateKey<Translation>(
      `transloco:${translationPath}`,
    );

    if (
      isPlatformBrowser(this.platformId) &&
      this.transferState.hasKey(stateKey)
    ) {
      const translation = this.transferState.get(stateKey, {});
      this.transferState.remove(stateKey);
      return of(translation);
    }

    return this.http.get<Translation>(translationPath).pipe(
      tap((translation) => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(stateKey, translation);
        }
      }),
    );
  }

  private resolvePath(langOrScopeLang: string): string {
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
}
