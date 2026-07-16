const I18N_SCOPE_PATTERN =
  /\b(?:about|auth|chaoticThursdays|common|contact|contentArticles|cta|empty|errors|eventSignup|footer|footnotes|hero|home|joinTheParty|legal|nav|offers|ourTeam|page|pricingTable|seo|sessionReservation|sessions|standardsAndLogistics|status)(?:\.[A-Za-z0-9_-]+)+\b/g;

export function parsePublicSeoHtml(html) {
  const title = getElementTexts(html, 'title')[0] ?? null;
  const h1 = getElementTexts(html, 'h1');
  const metaTags = getTags(html, 'meta').map(parseAttributes);
  const linkTags = getTags(html, 'link').map(parseAttributes);
  const imageTags = getTags(html, 'img').map(parseAttributes);
  const jsonLd = parseJsonLd(html);
  const visibleText = stripMarkup(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' '),
  );

  return {
    title,
    metaDescription: findMetaContent(metaTags, 'description'),
    canonical:
      linkTags.find((attributes) =>
        splitTokens(attributes.get('rel')).includes('canonical'),
      )?.get('href') ?? null,
    robots: findMetaContent(metaTags, 'robots'),
    h1,
    jsonLdTypes: [...jsonLd.types].sort(),
    invalidJsonLd: jsonLd.invalidCount,
    imagesWithoutAlt: imageTags.filter((attributes) => !attributes.has('alt'))
      .length,
    shellMarkers: {
      appRoot: /<app-root(?:\s|>)/i.test(html),
      completeHtml: /<\/html>/i.test(html),
      unresolved: [
        ...(visibleText.includes('undefined') ? ['undefined'] : []),
        ...(visibleText.includes('[object Object]') ? ['[object Object]'] : []),
      ],
    },
    i18nKeys: [...new Set(visibleText.match(I18N_SCOPE_PATTERN) ?? [])].sort(),
    cloudflareChallenge:
      /Just a moment\.\.\.|cf-chl-|challenge-platform|cdn-cgi\/challenge-platform/i.test(
        html,
      ),
  };
}

function getElementTexts(html, tagName) {
  const pattern = new RegExp(
    `<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    'gi',
  );

  return [...html.matchAll(pattern)]
    .map((match) => stripMarkup(match[1]))
    .filter(Boolean);
}

function getTags(html, tagName) {
  const pattern = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  return [...html.matchAll(pattern)].map((match) => match[0]);
}

function parseAttributes(tag) {
  const attributes = new Map();
  const pattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

  for (const match of tag.matchAll(pattern)) {
    const name = match[1].toLowerCase();

    if (name.startsWith('<')) {
      continue;
    }

    attributes.set(
      name,
      decodeEntities(match[2] ?? match[3] ?? match[4] ?? ''),
    );
  }

  return attributes;
}

function findMetaContent(metaTags, name) {
  return (
    metaTags.find(
      (attributes) => attributes.get('name')?.toLowerCase() === name,
    )?.get('content') ?? null
  );
}

function splitTokens(value) {
  return (value ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function parseJsonLd(html) {
  const types = new Set();
  let invalidCount = 0;
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(pattern)) {
    const attributes = parseAttributes(`<script ${match[1]}>`);

    if (attributes.get('type')?.toLowerCase() !== 'application/ld+json') {
      continue;
    }

    try {
      collectJsonLdTypes(JSON.parse(match[2]), types);
    } catch {
      invalidCount += 1;
    }
  }

  return { types, invalidCount };
}

function collectJsonLdTypes(value, types) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLdTypes(item, types));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  const type = value['@type'];

  if (typeof type === 'string') {
    types.add(type);
  } else if (Array.isArray(type)) {
    type
      .filter((item) => typeof item === 'string')
      .forEach((item) => types.add(item));
  }

  Object.values(value).forEach((item) => collectJsonLdTypes(item, types));
}

function stripMarkup(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeEntities(value) {
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
    .replaceAll('&apos;', "'")
    .replaceAll('&nbsp;', ' ');
}
