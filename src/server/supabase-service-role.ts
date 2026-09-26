import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../env/environment';

let serviceRoleClient: SupabaseClient | null = null;

export function getServiceRoleClient(): SupabaseClient | null {
  if (serviceRoleClient) return serviceRoleClient;

  const key = process.env['SUPABASE_SERVICE_ROLE_KEY']?.trim();

  if (!key) return null;

  serviceRoleClient = createClient(environment.supabase.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return serviceRoleClient;
}
