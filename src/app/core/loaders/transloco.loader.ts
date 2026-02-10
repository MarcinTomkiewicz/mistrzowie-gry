// path: src/app/core/loaders/transloco.loader.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

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


  getTranslation(langOrScopeLang: string): Observable<Translation> {
    const url = this.resolveUrl(langOrScopeLang);

    return this.http.get<Translation>(url);
  }

  private resolveUrl(langOrScopeLang: string): string {
    // scope/lang: bierzemy ostatni segment jako lang, reszta jako namespace
    if (langOrScopeLang.includes('/')) {
      const parts = langOrScopeLang.split('/').filter(Boolean);
      const lang = parts.at(-1) ?? 'pl';
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
