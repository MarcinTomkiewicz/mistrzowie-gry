import { DOCUMENT } from '@angular/common';
import {
  Injectable,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import type { IThemeMode } from '../../interfaces/i-theme';
import { Platform } from '../platform/platform';

const STORAGE_KEY = 'mg-theme';

@Injectable({ providedIn: 'root' })
export class Theme {
  private readonly platform = inject(Platform);
  private readonly document = inject(DOCUMENT);

  private readonly mode = signal<IThemeMode>('dark');

  readonly isLight = computed(() => this.mode() === 'light');
  readonly current = computed(() => this.mode());

  readonly brandLogoSrc = computed(() =>
    this.isLight() ? 'theme/light/brand.png' : 'theme/dark/brand.png',
  );

  constructor() {
    afterNextRender(() => {
      this.initBrowserTheme();
    });
  }

  toggle(): void {
    this.set(this.isLight() ? 'dark' : 'light');
  }

  set(next: IThemeMode, opts?: { persist?: boolean; writeDom?: boolean }): void {
    const persist = opts?.persist ?? true;
    const writeDom = opts?.writeDom ?? true;

    this.mode.set(next);

    if (writeDom && this.platform.isBrowser) {
      const root = this.document.documentElement;

      if (next === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
    }

    if (persist) {
      this.safeWriteStorage(next);
    }
  }

  clearPreference(): void {
    if (!this.platform.isBrowser) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }

    this.set(this.getPreferredSystemTheme(), {
      persist: false,
      writeDom: true,
    });
  }

  private initBrowserTheme(): void {
    if (!this.platform.isBrowser) return;

    const stored = this.safeReadStorage();
    const domMode = this.readThemeFromDom();
    const preferred = this.getPreferredSystemTheme();

    this.set(stored ?? domMode ?? preferred, {
      persist: false,
      writeDom: true,
    });

    if (stored) return;

    const mq = this.platform.matchMedia('(prefers-color-scheme: light)');
    if (!mq) return;

    const handler = (event: MediaQueryListEvent): void => {
      if (this.safeReadStorage()) return;

      this.set(event.matches ? 'light' : 'dark', {
        persist: false,
        writeDom: true,
      });
    };

    mq.addEventListener?.('change', handler);
  }

  private readThemeFromDom(): IThemeMode {
    return this.document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark';
  }

  private getPreferredSystemTheme(): IThemeMode {
    return this.platform.matchMedia('(prefers-color-scheme: light)')?.matches
      ? 'light'
      : 'dark';
  }

  private safeReadStorage(): IThemeMode | null {
    if (!this.platform.isBrowser) return null;

    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch {
      return null;
    }
  }

  private safeWriteStorage(value: IThemeMode): void {
    if (!this.platform.isBrowser) return;

    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
  }
}