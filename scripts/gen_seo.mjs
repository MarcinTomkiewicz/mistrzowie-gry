#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const BASE_URL =
  process.env.PUBLIC_BASE_URL?.replace(/\/+$/, '') ||
  (() => {
    throw new Error('Missing PUBLIC_BASE_URL');
  })();

const INDEXABLE = process.env.INDEXABLE === 'true';

const distBrowser = resolve(__dirname, '..', 'dist', 'mistrzowie-gry', 'browser');
mkdirSync(distBrowser, { recursive: true });

const staticRoutes = readJsonArray(resolve(__dirname, 'public-routes.json'));
const dynOfferPages = readJsonArray(resolve(__dirname, 'dynamic', 'offer-pages.json'));

const now = new Date().toISOString();
const entries = [];

for (const path of staticRoutes) {
  entries.push({
    loc: `${BASE_URL}${path}`,
    lastmod: now,
    prio: path === '/' ? '1.0' : '0.7',
  });
}

for (const item of dynOfferPages) {
  const slug = typeof item === 'string' ? item : item.slug;
  const lm = typeof item === 'string' ? undefined : item.lastmod;

  if (!slug) continue;

  entries.push({
    loc: `${BASE_URL}/offer/${encodeURIComponent(slug)}`,
    lastmod: lm ?? now,
    prio: '0.7',
  });
}

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  entries
    .sort((a, b) => a.loc.localeCompare(b.loc))
    .map(
      ({ loc, lastmod, prio }) =>
        `  <url>\n` +
        `    <loc>${escapeXml(loc)}</loc>\n` +
        `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>\n` +
        `    <changefreq>weekly</changefreq>\n` +
        `    <priority>${prio}</priority>\n` +
        `  </url>`,
    )
    .join('\n') +
  `\n</urlset>\n`;

writeFileSync(resolve(distBrowser, 'sitemap.xml'), sitemap, 'utf-8');

const robots = INDEXABLE
  ? `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`
  : `User-agent: *
Disallow: /
`;

writeFileSync(resolve(distBrowser, 'robots.txt'), robots, 'utf-8');

console.log(
  `[seo] generated ${entries.length} urls -> dist/mistrzowie-gry/browser/sitemap.xml & robots.txt (indexable=${INDEXABLE})`,
);

function readJsonArray(path) {
  if (!existsSync(path)) return [];
  try {
    const value = JSON.parse(readFileSync(path, 'utf-8'));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}