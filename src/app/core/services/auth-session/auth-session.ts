import { DOCUMENT } from '@angular/common';
import { Injectable, REQUEST, inject, signal } from '@angular/core';

import { Platform } from '../platform/platform';

const AUTH_COOKIE_NAME = /^sb-.*-auth-token(?:\.\d+)?$/;

@Injectable({ providedIn: 'root' })
export class AuthSession {
  private readonly platform = inject(Platform);
  private readonly document = inject(DOCUMENT);
  private readonly request = inject(REQUEST, { optional: true });

  private readonly _hasSessionCookie = signal(false);

  readonly hasSessionCookie = this._hasSessionCookie.asReadonly();

  constructor() {
    this.refresh();

    if (!this.platform.isBrowser) {
      return;
    }

    this.platform.onWindow('focus', () => this.refresh());
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  setHasSessionCookie(next: boolean): void {
    this._hasSessionCookie.set(next);
  }

  refresh(): void {
    this._hasSessionCookie.set(this.hasAuthCookie());
  }

  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') {
      this.refresh();
    }
  };

  private hasAuthCookie(): boolean {
    const cookieSource = this.platform.isBrowser
      ? this.document.cookie
      : (this.request?.headers.get('cookie') ?? '');

    if (!cookieSource.trim()) {
      return false;
    }

    return cookieSource
      .split(';')
      .map((part) => part.trim())
      .some((cookie) => {
        const separatorIndex = cookie.indexOf('=');
        const rawName =
          separatorIndex === -1 ? cookie : cookie.slice(0, separatorIndex);

        return AUTH_COOKIE_NAME.test(rawName.trim());
      });
  }
}
