import { readFileSync } from 'node:fs';

import { extractHtmlHrefs } from './public-seo-audit-html.mjs';

const ARTICLE_PATH_PATTERN = /^\/artykuly\/[^/]+$/;
const ARTICLE_HREF_CANDIDATE_PATTERN = /(?:^|\/)artykuly\//;
const PUBLIC_STATIC_PATHS = loadPublicStaticPaths();

export function buildSitemapCoverage({
  sitemapXml,
  articleListHtml,
  publicBaseUrl,
}) {
  const parsedSitemap = parseSitemapUrls(sitemapXml, publicBaseUrl);
  const expectedStaticUrls = buildExpectedStaticUrls(publicBaseUrl);
  const expectedArticleUrls = extractPublicArticleUrls(
    articleListHtml,
    publicBaseUrl,
  );
  const duplicateLocs = findDuplicates(parsedSitemap.urls);
  const sitemapUrls = [...new Set(parsedSitemap.urls)].sort();
  const sitemapUrlSet = new Set(sitemapUrls);
  const expectedArticleSet = new Set(expectedArticleUrls);
  const missingUrls = [
    ...expectedStaticUrls.map((url) => ({ url, source: 'public-routes.json' })),
    ...expectedArticleUrls.map((url) => ({ url, source: 'SSR /artykuly' })),
  ].filter(({ url }) => !sitemapUrlSet.has(url));
  const unexpectedArticleUrls = sitemapUrls.filter(
    (url) => isArticleUrl(url) && !expectedArticleSet.has(url),
  );

  return {
    sitemapLocs: parsedSitemap.locs,
    sitemapUrls,
    expectedStaticUrls,
    expectedArticleUrls,
    missingUrls,
    unexpectedArticleUrls,
    duplicateLocs,
  };
}

function parseSitemapUrls(xml, publicBaseUrl) {
  const publicOrigin = new URL(publicBaseUrl).origin;
  const locs = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) =>
    decodeXml(match[1].trim()),
  );

  if (!locs.length) {
    throw new Error('Runtime sitemap contains no <loc> entries');
  }

  const urls = locs.map((value) => {
    const url = parseAbsoluteUrl(value, 'sitemap URL');

    if (url.origin !== publicOrigin || url.search || url.hash) {
      throw new Error(`Invalid public sitemap URL: ${value}`);
    }

    return normalizeCoverageUrl(url);
  });

  return { locs, urls };
}

function extractPublicArticleUrls(html, publicBaseUrl) {
  const publicSite = new URL('/', publicBaseUrl);
  const urls = [];

  for (const href of extractHtmlHrefs(html)) {
    const candidate = ARTICLE_HREF_CANDIDATE_PATTERN.test(href.trim());
    let url;

    try {
      url = new URL(href, publicSite);
    } catch (error) {
      if (candidate) {
        throw new Error(`Malformed public article href: ${href}`, {
          cause: error,
        });
      }

      continue;
    }

    if (url.origin !== publicSite.origin) {
      continue;
    }

    if (candidate) {
      requireValidPathEncoding(url.pathname, href);
    }

    const normalized = normalizeCoverageUrl(url);

    if (isArticleUrl(normalized)) {
      urls.push(normalized);
    }
  }

  return [...new Set(urls)].sort();
}

function buildExpectedStaticUrls(publicBaseUrl) {
  return PUBLIC_STATIC_PATHS.map((path) =>
    normalizeCoverageUrl(new URL(path, `${publicBaseUrl}/`)),
  ).sort();
}

function normalizeCoverageUrl(value) {
  const url = new URL(value);

  url.search = '';
  url.hash = '';

  if (url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  return url.toString();
}

function isArticleUrl(value) {
  return ARTICLE_PATH_PATTERN.test(new URL(value).pathname);
}

function findDuplicates(values) {
  const counts = new Map();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts]
    .filter(([, count]) => count > 1)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => a.url.localeCompare(b.url));
}

function parseAbsoluteUrl(value, label) {
  try {
    return new URL(value);
  } catch (error) {
    throw new Error(`Malformed ${label}: ${value}`, { cause: error });
  }
}

function requireValidPathEncoding(pathname, href) {
  try {
    decodeURI(pathname);
  } catch (error) {
    throw new Error(`Malformed public article href: ${href}`, {
      cause: error,
    });
  }
}

function loadPublicStaticPaths() {
  const value = JSON.parse(
    readFileSync(new URL('./public-routes.json', import.meta.url), 'utf8'),
  );

  if (!Array.isArray(value) || value.some((path) => typeof path !== 'string')) {
    throw new Error('public-routes.json must contain an array of paths');
  }

  return value;
}

function decodeXml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'");
}
