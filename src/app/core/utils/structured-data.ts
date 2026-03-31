import { ISeoStructuredDataNode } from '../interfaces/i-seo';
import {
  ORGANIZATION_ID,
  SITE_URL,
  VENUE_COUNTRY,
  VENUE_LOCALITY,
  VENUE_NAME,
  VENUE_STREET_ADDRESS,
  WEBSITE_ID,
} from '../config/site';

type StructuredDataNode = ISeoStructuredDataNode;

type PageStructuredDataOptions = {
  type: string;
  id: string;
  url: string;
  name: string;
  description?: string;
  mainEntity?: StructuredDataNode;
};

type OfferStructuredDataOptions = {
  price: string;
  url: string;
  priceCurrency?: string;
  availability?: string;
};

type EventStructuredDataOptions = {
  id: string;
  url: string;
  name: string;
  description?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  location?: StructuredDataNode;
  organizer?: StructuredDataNode;
  offers?: StructuredDataNode;
  subEvent?: StructuredDataNode[];
  eventSchedule?: StructuredDataNode;
};

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

export function createWebsiteRef(siteUrl = SITE_URL): StructuredDataNode {
  return {
    '@id': siteUrl === SITE_URL ? WEBSITE_ID : `${siteUrl}/#website`,
  };
}

export function createVenuePlace(): StructuredDataNode {
  return {
    '@type': 'Place',
    name: VENUE_NAME,
    address: {
      '@type': 'PostalAddress',
      streetAddress: VENUE_STREET_ADDRESS,
      addressLocality: VENUE_LOCALITY,
      addressCountry: VENUE_COUNTRY,
    },
  };
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
