#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL or SUPABASE_*_KEY not set');
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const outDir = resolve(__dirname, 'dynamic');
mkdirSync(outDir, { recursive: true });

async function main() {
  const offerPages = await selectMap(
    sb.from('offer_pages').select('slug, updated_at, created_at'),
    (row) => ({
      slug: row.slug,
      lastmod: row.updated_at ?? row.created_at ?? undefined,
    }),
  );

  writeJson('offer-pages.json', offerPages);

  console.log(`[dynamic] offerPages=${offerPages.length}`);
}

async function selectMap(query, map) {
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(map).filter(Boolean);
}

function writeJson(name, arr) {
  writeFileSync(resolve(outDir, name), JSON.stringify(arr, null, 2), 'utf-8');
}

main().catch((e) => {
  console.error('[dynamic] error', e);
  process.exit(1);
});