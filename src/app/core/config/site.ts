import { ISeoStructuredDataNode } from '../interfaces/i-seo';

export const SITE_URL = 'https://mistrzowie-gry.pl';
export const SITE_NAME = 'Mistrzowie Gry';
export const SOCIAL_SHARE_IMAGE =
  'https://ik.imagekit.io/ialsnkfw5g/logo/logoMG.png?tr=w-1200,q-75,f-jpg';

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const THEME_LIGHT_BRAND_IMAGE = 'theme/light/brand.avif';
export const THEME_DARK_BRAND_IMAGE = 'theme/dark/brand.avif';
export const THEME_LIGHT_FOOTER_IMAGE = 'theme/light/footer.avif';
export const THEME_DARK_FOOTER_IMAGE = 'theme/dark/footer.avif';

export const VENUE_NAME = 'Pub Pod Dwoma Miotlami';
export const VENUE_STREET_ADDRESS = 'Wroniecka 21';
export const VENUE_LOCALITY = 'Poznan';
export const VENUE_COUNTRY = 'PL';

export function buildSiteUrl(path = ''): string {
  if (!path || path === '/') {
    return SITE_URL;
  }

  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function createOrganizationStructuredData(): ISeoStructuredDataNode {
  return {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: SOCIAL_SHARE_IMAGE,
      width: 1200,
      height: 1200,
    },
    email: 'kontakt@mistrzowie-gry.pl',
    telephone: '+48 533 616 491',
    sameAs: [
      'https://facebook.com/mistrzowie.gry',
      'https://instagram.com/mistrzowie.gry',
    ],
  };
}

export function createWebsiteStructuredData(): ISeoStructuredDataNode {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: {
      '@id': ORGANIZATION_ID,
    },
    inLanguage: 'pl-PL',
  };
}
