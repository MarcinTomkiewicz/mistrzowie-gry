import { InjectionToken } from '@angular/core';

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
};

export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>(
  'SUPABASE_CONFIG',
);