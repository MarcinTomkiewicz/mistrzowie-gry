import {
  ORGANIZATION_ID,
  SITE_URL,
  VENUE_COUNTRY,
  VENUE_LOCALITY,
  VENUE_NAME,
  VENUE_STREET_ADDRESS,
  WEBSITE_ID,
} from '../config/site';
import type { BreadcrumbItem } from '../types/breadcrumb';
import {
  ArticleStructuredDataOptions,
  EventStructuredDataOptions,
  OfferStructuredDataOptions,
  PageStructuredDataOptions,
  PlaceStructuredDataOptions,
  StructuredDataNode,
} from '../types/structured-data';

function compactNode<T extends StructuredDataNode>(node: T): T {
  return Object.fromEntries(
    Object.entries(node).filter(([, value]) => value !== undefined),
  ) as T;
}

export function createOrganizationRef(siteUrl = SITE_URL): StructuredDataNode {
  return {
    '@id': siteUrl === SITE_URL ? ORGANIZATION_ID : `${siteUrl}/#organization`,
  };
}

export function createBreadcrumbStructuredData(
  items: readonly BreadcrumbItem[],
): StructuredDataNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) =>
      compactNode({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.path
          ? new URL(item.path, `${SITE_URL}/`).toString()
          : undefined,
      }),
    ),
  };
}

function createWebsiteRef(siteUrl = SITE_URL): StructuredDataNode {
  return {
    '@id': siteUrl === SITE_URL ? WEBSITE_ID : `${siteUrl}/#website`,
  };
}

export function createPlaceStructuredData(
  options: PlaceStructuredDataOptions,
): StructuredDataNode {
  return compactNode({
    '@type': 'Place',
    name: options.venueName ?? undefined,
    address: compactNode({
      '@type': 'PostalAddress',
      streetAddress: options.venueAddress ?? undefined,
      addressLocality: options.city,
      addressCountry: options.country,
    }),
  });
}

function createVenuePlace(): StructuredDataNode {
  return createPlaceStructuredData({
    venueName: VENUE_NAME,
    venueAddress: VENUE_STREET_ADDRESS,
    city: VENUE_LOCALITY,
    country: VENUE_COUNTRY,
  });
}

export function createOfferStructuredData(
  options: OfferStructuredDataOptions,
): StructuredDataNode {
  return compactNode({
    '@type': 'Offer',
    price: options.price,
    priceCurrency: options.priceCurrency ?? 'PLN',
    availability: options.availability ?? 'https://schema.org/InStock',
    url: options.url,
  });
}

export function createPageStructuredData(
  options: PageStructuredDataOptions,
): StructuredDataNode {
  return compactNode({
    '@type': options.type,
    '@id': options.id,
    url: options.url,
    name: options.name,
    description: options.description,
    isPartOf: createWebsiteRef(),
    about: createOrganizationRef(),
    mainEntity: options.mainEntity,
  });
}

export function createEventStructuredData(
  options: EventStructuredDataOptions,
): StructuredDataNode {
  return compactNode({
    '@type': 'Event',
    '@id': options.id,
    url: options.url,
    name: options.name,
    description: options.description,
    image: options.image,
    startDate: options.startDate,
    endDate: options.endDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: options.location ?? createVenuePlace(),
    organizer: options.organizer ?? createOrganizationRef(),
    offers: options.offers,
    subEvent: options.subEvent,
    eventSchedule: options.eventSchedule,
  });
}

export function createArticleStructuredData(
  options: ArticleStructuredDataOptions,
): StructuredDataNode {
  return compactNode({
    '@type': 'Article',
    '@id': options.id,
    url: options.url,
    headline: options.headline,
    description: options.description,
    image: options.image,
    datePublished: options.datePublished,
    dateModified: options.dateModified,
    author: createOrganizationRef(),
    publisher: createOrganizationRef(),
    isPartOf: createWebsiteRef(),
  });
}
