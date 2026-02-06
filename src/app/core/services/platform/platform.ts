import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class Platform {
  private readonly platformId = inject(PLATFORM_ID);

  /** True tylko w przeglądarce (SSR-safe). */
  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Bezpieczny dostęp do window (SSR-safe). */
  get window(): Window | null {
    return this.isBrowser ? window : null;
  }

  /** Bezpieczny dostęp do document (SSR-safe). */
  get document(): Document | null {
    return this.isBrowser ? document : null;
  }

  /** Bezpieczny dostęp do window.location (SSR-safe). */
  get location(): Location | null {
    return this.isBrowser ? window.location : null;
  }

  /**
   * Nasłuch zdarzeń na window z cleanupem.
   * Zoneless-friendly: eventy nie wywołują automatycznie CD, więc komponenty
   * powinny same aktualizować sygnały / stan.
   */
  onWindow<K extends keyof WindowEventMap>(
    type: K,
    handler: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean
  ): () => void {
    if (!this.isBrowser) return () => {};

    const w = window;
    const fn = handler as EventListener;

    w.addEventListener(type, fn, options);

    return () => {
      w.removeEventListener(type, fn, options);
    };
  }

  /**
   * Preload obrazka przez <link rel="preload" as="image"> w <head>.
   * SSR-safe: w SSR no-op.
   */
  preloadImage(url: string): void {
    if (!this.isBrowser) return;
    if (!url) return;

    const doc = document;

    // Minimalna ochrona przed duplikacją
    // (CSS.escape jest w nowoczesnych przeglądarkach; jeśli targetujesz bardzo stare,
    // trzeba fallback, ale Angular 20/21 zwykle już tego nie wspiera).
    const safeUrl = CSS.escape(url);
    const existing = doc.head.querySelector<HTMLLinkElement>(
      `link[rel="preload"][as="image"][href="${safeUrl}"]`
    );
    if (existing) return;

    const link = doc.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;

    doc.head.appendChild(link);
  }

  /**
   * Otwiera URL w nowej karcie (noopener/noreferrer).
   * SSR-safe: w SSR no-op.
   */
  openNewTab(url: string): void {
    if (!this.isBrowser) return;
    if (!url) return;

    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
