import { Injectable, inject, REQUEST, RESPONSE_INIT } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CookieOptions,
  createBrowserClient,
  createServerClient,
} from '@supabase/ssr';

import { Platform } from '../platform/platform';
import {
  SUPABASE_CONFIG,
  SupabaseConfig,
} from '../../configs/supabase.config';

type SupabaseCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

@Injectable({ providedIn: 'root' })
export class Supabase {
  private readonly platform = inject(Platform);
  private readonly config = inject<SupabaseConfig>(SUPABASE_CONFIG);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly responseInit = inject(RESPONSE_INIT, { optional: true });

  private readonly _client: SupabaseClient;

  constructor() {
    this._client = this.platform.isBrowser
      ? createBrowserClient(this.config.url, this.config.publishableKey)
      : createServerClient(this.config.url, this.config.publishableKey, {
          cookies: {
            getAll: () => this.getAllCookies(),
            setAll: (cookies) => this.setAllCookies(cookies),
          },
        });
  }

  client(): SupabaseClient {
    return this._client;
  }

  private getAllCookies(): SupabaseCookie[] {
    const cookieHeader = this.request?.headers.get('cookie') ?? '';

    if (!cookieHeader.trim()) {
      return [];
    }

    return cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=');

        if (separatorIndex === -1) {
          return {
            name: decodeURIComponent(part),
            value: '',
          };
        }

        const name = part.slice(0, separatorIndex).trim();
        const value = part.slice(separatorIndex + 1).trim();

        return {
          name: decodeURIComponent(name),
          value: decodeURIComponent(value),
        };
      });
  }

  private setAllCookies(cookies: SupabaseCookie[]): void {
    if (!cookies.length || !this.responseInit) {
      return;
    }

    const headers = new Headers(this.responseInit.headers ?? {});

    for (const cookie of cookies) {
      headers.append(
        'Set-Cookie',
        this.serializeCookie(cookie.name, cookie.value, cookie.options),
      );
    }

    this.responseInit.headers = headers;
  }

  private serializeCookie(
    name: string,
    value: string,
    options?: CookieOptions,
  ): string {
    const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

    if (options?.maxAge !== undefined) {
      parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
    }

    if (options?.domain) {
      parts.push(`Domain=${options.domain}`);
    }

    if (options?.path) {
      parts.push(`Path=${options.path}`);
    } else {
      parts.push('Path=/');
    }

    if (options?.expires) {
      parts.push(`Expires=${options.expires.toUTCString()}`);
    }

    if (options?.httpOnly) {
      parts.push('HttpOnly');
    }

    if (options?.secure) {
      parts.push('Secure');
    }

    if (options?.sameSite) {
      const sameSite =
        typeof options.sameSite === 'string'
          ? this.normalizeSameSite(options.sameSite)
          : options.sameSite === true
            ? 'Strict'
            : undefined;

      if (sameSite) {
        parts.push(`SameSite=${sameSite}`);
      }
    }

    return parts.join('; ');
  }

  private normalizeSameSite(value: string): 'Lax' | 'Strict' | 'None' {
    switch (value.toLowerCase()) {
      case 'strict':
        return 'Strict';
      case 'none':
        return 'None';
      default:
        return 'Lax';
    }
  }
}