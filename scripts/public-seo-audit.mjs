import { parsePublicSeoHtml } from './public-seo-audit-html.mjs';
import { fetchText } from './public-seo-audit-http.mjs';
import {
  buildPublicSeoFindings,
  countPublicSeoFindings,
} from './public-seo-audit-report.mjs';

const CONCURRENCY = 6;

export async function runPublicSeoAudit({
  originBaseUrl,
  publicBaseUrl,
}) {
  const publicUrl = normalizeBaseUrl(publicBaseUrl);
  const targets = [
    {
      name: 'origin',
      baseUrl: normalizeBaseUrl(originBaseUrl),
      hostHeader: new URL(publicUrl).host,
    },
    {
      name: 'public',
      baseUrl: publicUrl,
      hostHeader: null,
    },
  ];
  const results = [];

  for (const target of targets) {
    results.push(await auditTarget(target, publicUrl));
  }

  return {
    generatedAt: new Date().toISOString(),
    sitemapSource: 'runtime',
    targets: results,
    totals: countPublicSeoFindings(
      results.flatMap((target) => target.findings),
      results.filter((target) => target.error).length,
    ),
  };
}

function normalizeBaseUrl(value) {
  const url = new URL(value);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Unsupported audit URL protocol: ${url.protocol}`);
  }

  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';

  return url.toString().replace(/\/$/, '');
}

async function auditTarget(target, publicBaseUrl) {
  const sitemapUrl = new URL('/sitemap.xml', `${target.baseUrl}/`).toString();

  try {
    const sitemap = await fetchText(sitemapUrl, target.hostHeader);

    if (sitemap.status !== 200) {
      throw new Error(`HTTP ${sitemap.status}`);
    }

    const publicUrls = parseSitemapUrls(sitemap.body, publicBaseUrl);
    const pages = await mapWithConcurrency(
      publicUrls,
      CONCURRENCY,
      (publicUrl) => auditPage(target, publicUrl),
    );
    const findings = buildPublicSeoFindings(target, pages);

    return {
      name: target.name,
      baseUrl: target.baseUrl,
      sitemapUrl,
      error: null,
      pages,
      findings,
      counts: countPublicSeoFindings(findings),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return {
      name: target.name,
      baseUrl: target.baseUrl,
      sitemapUrl,
      error: message,
      pages: [],
      findings: [],
      counts: countPublicSeoFindings([], 1),
    };
  }
}

function parseSitemapUrls(xml, publicBaseUrl) {
  const publicOrigin = new URL(publicBaseUrl).origin;
  const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)].map((match) =>
    decodeXml(match[1].trim()),
  );

  if (!urls.length) {
    throw new Error('Runtime sitemap contains no <loc> entries');
  }

  const normalized = urls.map((value) => {
    const url = new URL(value);

    if (url.origin !== publicOrigin || url.search || url.hash) {
      throw new Error(`Invalid public sitemap URL: ${value}`);
    }

    return normalizeSeoUrl(url.toString());
  });

  return [...new Set(normalized)].sort();
}

async function auditPage(target, publicUrl) {
  const expectedUrl = new URL(publicUrl);
  const requestUrl = new URL(
    `${expectedUrl.pathname}${expectedUrl.search}`,
    `${target.baseUrl}/`,
  ).toString();

  try {
    const response = await fetchText(requestUrl, target.hostHeader);
    const parsed = parsePublicSeoHtml(response.body);

    return {
      url: publicUrl,
      requestedUrl: requestUrl,
      finalUrl: response.finalUrl,
      status: response.status,
      contentType: response.contentType,
      ...parsed,
      duplicateTitle: false,
      duplicateDescription: false,
      fetchError: null,
    };
  } catch (error) {
    return {
      url: publicUrl,
      requestedUrl: requestUrl,
      finalUrl: null,
      status: null,
      contentType: null,
      title: null,
      metaDescription: null,
      canonical: null,
      robots: null,
      h1: [],
      jsonLdTypes: [],
      invalidJsonLd: 0,
      imagesWithoutAlt: 0,
      shellMarkers: {
        appRoot: false,
        completeHtml: false,
        unresolved: [],
      },
      i18nKeys: [],
      cloudflareChallenge: false,
      duplicateTitle: false,
      duplicateDescription: false,
      fetchError: error instanceof Error ? error.message : String(error),
    };
  }
}

function normalizeSeoUrl(value) {
  const url = new URL(value);

  url.search = '';
  url.hash = '';

  if (url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  return url.toString();
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (nextIndex < values.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await mapper(values[index], index);
      }
    },
  );

  await Promise.all(workers);
  return results;
}
