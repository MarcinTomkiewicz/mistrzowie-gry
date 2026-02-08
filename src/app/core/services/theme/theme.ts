import { Injectable, computed, inject, signal } from '@angular/core';
import { Platform } from '../platform/platform';
import type { IThemeMode } from '../../interfaces/i-theme';

const STORAGE_KEY = 'mg-theme'; // 'light' | 'dark'

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly platform = inject(Platform);

  /** Źródło prawdy */
  private readonly mode = signal<IThemeMode>('dark');

  /** Public API */
  readonly isLight = computed(() => this.mode() === 'light');
  readonly isDark = computed(() => this.mode() === 'dark');
  readonly current = computed(() => this.mode());

  /** Pomocnicze: ścieżki assetów zależne od motywu */
  readonly assetsBase = computed(() => (this.isLight() ? 'theme/light' : 'theme/dark'));
  readonly brandLogoSrc = computed(() => `${this.assetsBase()}/brand.png`);

  constructor() {
    // SSR-safe init
    if (!this.platform.isBrowser) return;

    const doc = this.platform.document;
    const win = this.platform.window;
    if (!doc || !win) return;

    // 1) localStorage (jeśli ustawione wcześniej)
    const stored = this.safeReadStorage();

    // 2) DOM (gdy SSR/hydration już wyrenderowały atrybut)
    const domMode: IThemeMode =
      doc.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

    // 3) prefers-color-scheme
    const prefersLight =
      win.matchMedia?.('(prefers-color-scheme: light)')?.matches ?? false;
    const preferred: IThemeMode = prefersLight ? 'light' : 'dark';

    // Priorytet: storage > DOM > prefers
    const initial = stored ?? domMode ?? preferred;
    this.set(initial, { persist: false, writeDom: true });

    // Reaguj na zmianę systemowego motywu, ale tylko jeśli user nie “wymusił”
    if (!stored && win.matchMedia) {
      const mq = win.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener?.('change', (e) => {
        // jeśli user nie ma ustawienia w storage, podążamy za systemem
        const stillNoStored = !this.safeReadStorage();
        if (!stillNoStored) return;
        this.set(e.matches ? 'light' : 'dark', { persist: false, writeDom: true });
      });
    }
  }

  toggle(): void {
    this.set(this.isLight() ? 'dark' : 'light');
  }

  setLight(): void {
    this.set('light');
  }

  setDark(): void {
    this.set('dark');
  }

  /**
   * Ustaw tryb.
   * - persist: zapis do localStorage (default true)
   * - writeDom: ustawia/removuje data-theme (default true)
   */
  set(next: IThemeMode, opts?: { persist?: boolean; writeDom?: boolean }): void {
    const persist = opts?.persist ?? true;
    const writeDom = opts?.writeDom ?? true;

    this.mode.set(next);

    if (!this.platform.isBrowser) return;

    const doc = this.platform.document;
    if (writeDom && doc) {
      const root = doc.documentElement;
      if (next === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
    }

    if (persist) this.safeWriteStorage(next);
  }

  /** Jeśli kiedyś chcesz “wrócić do systemowego” bez preferencji usera */
  clearPreference(): void {
    if (!this.platform.isBrowser) return;
    try {
      this.platform.window?.localStorage?.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  // -------------------------
  // storage helpers
  // -------------------------

  private safeReadStorage(): IThemeMode | null {
    if (!this.platform.isBrowser) return null;
    try {
      const v = this.platform.window?.localStorage?.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark') return v;
      return null;
    } catch {
      return null;
    }
  }

  private safeWriteStorage(v: IThemeMode): void {
    if (!this.platform.isBrowser) return;
    try {
      this.platform.window?.localStorage?.setItem(STORAGE_KEY, v);
    } catch {
      // ignore
    }
  }
}
