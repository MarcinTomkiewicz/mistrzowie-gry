import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

type IdleCapableWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (id: number) => void;
};

@Injectable({ providedIn: 'root' })
export class Platform {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly documentRef = inject(DOCUMENT);

  readonly isBrowser = isPlatformBrowser(this.platformId);

  onWindow<K extends keyof WindowEventMap>(
    type: K,
    handler: (event: WindowEventMap[K]) => void,
    options?: AddEventListenerOptions | boolean,
  ): () => void {
    if (!this.isBrowser) return () => {};

    const fn = handler as EventListener;
    window.addEventListener(type, fn, options);

    return () => {
      window.removeEventListener(type, fn, options);
    };
  }


onIdle(callback: () => void, timeout = 300): () => void {
  if (!this.isBrowser) return () => {};

  const win = window as IdleCapableWindow;

  if (typeof win.requestIdleCallback === 'function') {
    const id = win.requestIdleCallback(() => callback());

    return () => {
      if (typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(id);
      }
    };
  }

  const id = win.setTimeout(callback, timeout);

  return () => {
    win.clearTimeout(id);
  };
}

  preloadImage(url: string): void {
    if (!this.isBrowser || !url) return;

    const doc = this.documentRef;
    const safeUrl = CSS.escape(url);

    const existing = doc.head.querySelector<HTMLLinkElement>(
      `link[rel="preload"][as="image"][href="${safeUrl}"]`,
    );
    if (existing) return;

    const link = doc.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;

    doc.head.appendChild(link);
  }

  openNewTab(url: string): void {
    if (!this.isBrowser || !url) return;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  matchMedia(query: string): MediaQueryList | null {
    if (!this.isBrowser || !query) return null;
    return window.matchMedia(query);
  }
}