export type ISeoRobots = 'index,follow' | 'noindex,nofollow' | 'noindex,follow' | 'index,nofollow';

export interface ISeoOpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  type?: string; // e.g. image/png
}

export type ISeoStructuredDataNode = Record<string, unknown>;

export interface PageStructuredDataOptions {
  type: string;
  id: string;
  url: string;
  name: string;
  description?: string;
  mainEntity?: ISeoStructuredDataNode;
}

export interface PlaceStructuredDataOptions {
  venueName: string | null;
  venueAddress: string | null;
  city: string;
  country: string;
}

export interface OfferStructuredDataOptions {
  price: string;
  url: string;
  priceCurrency?: string;
  availability?: string;
}

export interface EventStructuredDataOptions {
  id: string;
  url: string;
  name: string;
  description?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  location?: ISeoStructuredDataNode;
  organizer?: ISeoStructuredDataNode;
  offers?: ISeoStructuredDataNode;
  subEvent?: ISeoStructuredDataNode[];
  eventSchedule?: ISeoStructuredDataNode;
}

export interface ArticleStructuredDataOptions {
  id: string;
  url: string;
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

export interface ISeoConfig {
  /** <title> */
  title: string;

  /** <meta name="description"> */
  description?: string;

  /** Canonical absolute URL (recommended). If not provided, we auto-build from Router URL if possible. */
  canonicalUrl?: string;

  /** <meta name="robots"> */
  robots?: ISeoRobots;

  /** OpenGraph */
  og?: {
    title?: string;
    description?: string;
    type?: 'website' | 'article';
    url?: string;
    siteName?: string;
    images?: ISeoOpenGraphImage[];
  };

  /** Twitter cards */
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    image?: string;
  };

  /** JSON-LD / Schema.org structured data */
  structuredData?: ISeoStructuredDataNode | ISeoStructuredDataNode[];
}
