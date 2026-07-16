import type express from 'express';
import { createClient } from '@supabase/supabase-js';

import publicStaticPaths from '../../scripts/public-routes.json';
import { buildSiteUrl, SITE_URL } from '../app/core/config/site';
import type { ISitemapEntry } from '../app/core/interfaces/i-sitemap-entry';
import { environment } from '../env/environment';

const SITEMAP_RPC = 'get_public_sitemap_entries';
const PUBLIC_CACHE_CONTROL =
  'public, max-age=300, s-maxage=900, stale-if-error=86400';
const ERROR_CACHE_CONTROL = 'no-store';
const XML_CONTENT_TYPE = 'application/xml; charset=utf-8';
const TEXT_CONTENT_TYPE = 'text/plain; charset=utf-8';
const EXCLUDED_PATH_PREFIXES = [
  '/admin',
  '/assets',
  '/auth',
  '/preview',
  '/not-found',
  '/not-authorized',
] as const;

const sitemapClient = createClient(
  environment.supabase.url,
  environment.supabase.publishableKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

export function registerPublicSeoRoutes(app: express.Express): void {
  app.get('/sitemap.xml', handleSitemap);
  app.head('/sitemap.xml', handleSitemap);
  app.get('/robots.txt', handleRobots);
  app.head('/robots.txt', handleRobots);
}

async function handleSitemap(
  _req: express.Request,
  res: express.Response,
): Promise<void> {
  try {
    const dynamicEntries = await getDynamicEntries();
    const sitemap = serializeSitemap(buildSitemapEntries(dynamicEntries));

    sendResponse(
      res,
      200,
      XML_CONTENT_TYPE,
      PUBLIC_CACHE_CONTROL,
      sitemap,
    );
  } catch (error) {
    logPublicSeoError('sitemap', error);
    sendResponse(
      res,
      503,
      XML_CONTENT_TYPE,
      ERROR_CACHE_CONTROL,
      '<?xml version="1.0" encoding="UTF-8"?>\n<error>Service unavailable</error>\n',
    );
  }
}

function handleRobots(
  _req: express.Request,
  res: express.Response,
): void {
  try {
    const robots = serializeRobots(getIndexable());

    sendResponse(
      res,
      200,
      TEXT_CONTENT_TYPE,
      PUBLIC_CACHE_CONTROL,
      robots,
    );
  } catch (error) {
    logPublicSeoError('robots', error);
    sendResponse(
      res,
      503,
      TEXT_CONTENT_TYPE,
      ERROR_CACHE_CONTROL,
      'Robots configuration unavailable\n',
    );
  }
}

async function getDynamicEntries(): Promise<ISitemapEntry[]> {
  const response = await sitemapClient.rpc(SITEMAP_RPC);

  if (response.error) {
    throw new Error(`${SITEMAP_RPC} failed: ${response.error.message}`);
  }

  const data: unknown = response.data;

  if (!Array.isArray(data)) {
    throw new Error(`${SITEMAP_RPC} returned a non-array response`);
  }

  return data.map((entry, index) => parseSitemapEntry(entry, index));
}

function parseSitemapEntry(value: unknown, index: number): ISitemapEntry {
  if (!isRecord(value) || typeof value['path'] !== 'string') {
    throw new Error(`Sitemap entry ${index} has an invalid path`);
  }

  const lastModified = value['lastModified'];

  if (lastModified !== null && typeof lastModified !== 'string') {
    throw new Error(`Sitemap entry ${index} has an invalid lastModified`);
  }

  return {
    path: normalizePublicPath(value['path'], `Sitemap entry ${index}`),
    lastModified: normalizeLastModified(lastModified, index),
  };
}

function buildSitemapEntries(
  dynamicEntries: ISitemapEntry[],
): ISitemapEntry[] {
  const entriesByPath = new Map<string, ISitemapEntry>();
  const staticEntries = publicStaticPaths.map((path, index) => ({
    path: normalizePublicPath(path, `Static route ${index}`),
    lastModified: null,
  }));

  for (const entry of [...staticEntries, ...dynamicEntries]) {
    const existing = entriesByPath.get(entry.path);

    if (
      !existing ||
      (entry.lastModified &&
        (!existing.lastModified || entry.lastModified > existing.lastModified))
    ) {
      entriesByPath.set(entry.path, entry);
    }
  }

  return [...entriesByPath.values()].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
}

function normalizePublicPath(value: string, source: string): string {
  const trimmed = value.trim();

  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('?') ||
    trimmed.includes('#')
  ) {
    throw new Error(`${source} is not a valid public path`);
  }

  const path = trimmed === '/' ? '/' : trimmed.replace(/\/+$/, '');
  const url = new URL(path, SITE_URL);
  const isExcluded = EXCLUDED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (url.origin !== SITE_URL || url.pathname !== path || isExcluded) {
    throw new Error(`${source} is not a valid public path`);
  }

  return path;
}

function normalizeLastModified(
  value: string | null,
  index: number,
): string | null {
  if (value === null) {
    return null;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    throw new Error(`Sitemap entry ${index} has an invalid lastModified`);
  }

  return new Date(timestamp).toISOString();
}

function serializeSitemap(entries: ISitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastModified = entry.lastModified
        ? `\n    <lastmod>${entry.lastModified}</lastmod>`
        : '';

      return (
        `  <url>\n` +
        `    <loc>${escapeXml(buildSiteUrl(entry.path))}</loc>` +
        `${lastModified}\n` +
        `  </url>`
      );
    })
    .join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`
  );
}

function serializeRobots(indexable: boolean): string {
  if (!indexable) {
    return 'User-agent: *\nDisallow: /\n';
  }

  return (
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /admin/\n` +
    `Disallow: /auth/\n` +
    `Disallow: /preview/\n` +
    `Sitemap: ${SITE_URL}/sitemap.xml\n`
  );
}

function getIndexable(): boolean {
  const value = process.env['INDEXABLE'];

  if (value === 'true') return true;
  if (value === 'false') return false;

  throw new Error('INDEXABLE must be exactly "true" or "false"');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sendResponse(
  res: express.Response,
  status: number,
  contentType: string,
  cacheControl: string,
  body: string,
): void {
  res
    .status(status)
    .set('Content-Type', contentType)
    .set('Cache-Control', cacheControl)
    .send(body);
}

function logPublicSeoError(resource: string, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[PUBLIC SEO] ${resource} unavailable: ${message}`);
}
