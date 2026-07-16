const SEVERITIES = ['BLOCKER', 'HIGH', 'MEDIUM', 'LOW'];

export function buildPublicSeoFindings(target, pages) {
  const findings = pages.flatMap((page) => buildPageFindings(target, page));

  addDuplicateFindings(pages, findings, 'title', 'DUPLICATE_TITLE');
  addDuplicateFindings(
    pages,
    findings,
    'metaDescription',
    'DUPLICATE_DESCRIPTION',
  );

  return findings;
}

export function countPublicSeoFindings(findings, blockers = 0) {
  const counts = Object.fromEntries(
    SEVERITIES.map((severity) => [severity, 0]),
  );

  counts.BLOCKER = blockers;

  for (const finding of findings) {
    counts[finding.severity] += 1;
  }

  return counts;
}

export function formatPublicSeoAuditSummary(report) {
  const lines = [
    `Public SEO audit — ${report.generatedAt}`,
    'Source: runtime sitemap',
    '',
  ];

  for (const target of report.targets) {
    const counts = SEVERITIES.map(
      (severity) => `${severity}=${target.counts[severity]}`,
    ).join(' ');

    lines.push(
      `${target.name.toUpperCase()}: ${target.pages.length} URL(s) ${counts}`,
    );

    if (target.error) {
      lines.push(
        `[BLOCKER] ${target.name} ${target.sitemapUrl} — sitemap unavailable — ${target.error}`,
      );
    }

    for (const finding of sortFindings(target.findings)) {
      lines.push(
        `[${finding.severity}] ${target.name} ${finding.url} — ${finding.code} — ${finding.evidence}`,
      );
    }

    if (!target.error && !target.findings.length) {
      lines.push(`[OK] ${target.name} — no findings`);
    }

    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function buildPageFindings(target, page) {
  const findings = [];
  const add = (severity, code, evidence) =>
    findings.push({ severity, url: page.url, code, evidence });

  if (page.fetchError) {
    add('BLOCKER', 'FETCH_FAILED', page.fetchError);
    return findings;
  }

  if (page.status !== 200) {
    add(
      page.status && page.status >= 500 ? 'BLOCKER' : 'HIGH',
      'INVALID_STATUS',
      `expected HTTP 200, received ${page.status}`,
    );
  }

  if (!page.contentType?.toLowerCase().includes('text/html')) {
    add('BLOCKER', 'INVALID_CONTENT_TYPE', String(page.contentType));
  }

  if (page.cloudflareChallenge) {
    add('BLOCKER', 'CLOUDFLARE_CHALLENGE', 'challenge marker found in HTML');
  }

  if (!page.shellMarkers.appRoot || !page.shellMarkers.completeHtml) {
    add(
      'BLOCKER',
      'INCOMPLETE_SSR_HTML',
      `app-root=${page.shellMarkers.appRoot}, completeHtml=${page.shellMarkers.completeHtml}`,
    );
  }

  if (page.shellMarkers.unresolved.length) {
    add(
      'HIGH',
      'UNRESOLVED_SHELL_MARKER',
      page.shellMarkers.unresolved.join(', '),
    );
  }

  if (page.i18nKeys.length) {
    add('HIGH', 'UNRESOLVED_I18N', page.i18nKeys.join(', '));
  }

  if (!page.title) {
    add('HIGH', 'MISSING_TITLE', 'document has no non-empty <title>');
  }

  if (!page.metaDescription) {
    add('MEDIUM', 'MISSING_DESCRIPTION', 'meta description is absent');
  }

  if (!page.canonical) {
    add('HIGH', 'MISSING_CANONICAL', 'canonical link is absent');
  } else {
    const normalizedCanonical = normalizeCanonicalUrl(page.canonical);

    if (!normalizedCanonical) {
      add(
        'HIGH',
        'INVALID_CANONICAL',
        `canonical is not an absolute HTTP/HTTPS URL: ${page.canonical}`,
      );
    } else if (normalizedCanonical !== page.url) {
      add(
        'HIGH',
        'CANONICAL_MISMATCH',
        `expected ${page.url}, received ${page.canonical}`,
      );
    }
  }

  if (page.robots?.toLowerCase().includes('noindex')) {
    add('HIGH', 'INDEXABLE_URL_NOINDEX', page.robots);
  }

  if (!page.h1.length) {
    add('HIGH', 'MISSING_H1', 'SSR HTML has no non-empty H1');
  } else if (page.h1.length > 1) {
    add('MEDIUM', 'MULTIPLE_H1', page.h1.join(' | '));
  }

  if (page.invalidJsonLd) {
    add(
      'HIGH',
      'INVALID_JSON_LD',
      `${page.invalidJsonLd} JSON-LD block(s) could not be parsed`,
    );
  }

  if (!page.jsonLdTypes.length) {
    add('LOW', 'MISSING_JSON_LD', 'no JSON-LD type found');
  }

  if (page.imagesWithoutAlt) {
    add(
      'MEDIUM',
      'IMAGES_WITHOUT_ALT',
      `${page.imagesWithoutAlt} image(s) without alt attribute`,
    );
  }

  if (hasUnexpectedRedirect(target, page)) {
    add(
      'HIGH',
      'UNEXPECTED_REDIRECT',
      `requested ${page.requestedUrl}, finished at ${page.finalUrl}`,
    );
  }

  return findings;
}

function hasUnexpectedRedirect(target, page) {
  if (!page.finalUrl) {
    return false;
  }

  const expectedUrl =
    target.name === 'public' ? page.url : page.requestedUrl;

  return (
    normalizeRedirectUrl(page.finalUrl) !== normalizeRedirectUrl(expectedUrl)
  );
}

function addDuplicateFindings(pages, findings, field, code) {
  const groups = new Map();

  for (const page of pages) {
    const value = page[field]?.trim();

    if (value) {
      groups.set(value, [...(groups.get(value) ?? []), page]);
    }
  }

  for (const [value, group] of groups) {
    if (group.length < 2) {
      continue;
    }

    for (const page of group) {
      if (field === 'title') {
        page.duplicateTitle = true;
      } else {
        page.duplicateDescription = true;
      }

      findings.push({
        severity: 'MEDIUM',
        url: page.url,
        code,
        evidence: `"${value}" shared by ${group.map((item) => item.url).join(', ')}`,
      });
    }
  }
}

function sortFindings(findings) {
  return [...findings].sort(
    (a, b) =>
      SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity) ||
      a.url.localeCompare(b.url) ||
      a.code.localeCompare(b.code),
  );
}

function normalizeCanonicalUrl(value) {
  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }

    url.search = '';
    url.hash = '';

    return normalizeTrailingSlash(url).toString();
  } catch {
    return null;
  }
}

function normalizeRedirectUrl(value) {
  return normalizeTrailingSlash(new URL(value)).toString();
}

function normalizeTrailingSlash(url) {
  if (url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  return url;
}
