import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { Platform } from '../platform/platform';
import { SUPABASE_CONFIG, SupabaseConfig } from '../../configs/supabase.config';

@Injectable({ providedIn: 'root' })
export class Supabase {
  private readonly platform = inject(Platform);
  private readonly config = inject<SupabaseConfig>(SUPABASE_CONFIG);

  private readonly _client: SupabaseClient;

  constructor() {
    const isBrowser = this.platform.isBrowser;

    this._client = createClient(this.config.url, this.config.publishableKey, {
      auth: {
        persistSession: isBrowser,
        autoRefreshToken: isBrowser,
        detectSessionInUrl: isBrowser,
      },
    });
  }

  client(): SupabaseClient {
    return this._client;
  }
}
