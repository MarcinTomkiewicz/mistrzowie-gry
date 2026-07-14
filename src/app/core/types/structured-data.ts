import { ISeoStructuredDataNode } from '../interfaces/i-seo';

export type StructuredDataNode = ISeoStructuredDataNode;

export type PageStructuredDataOptions = {
  type: string;
  id: string;
  url: string;
  name: string;
  description?: string;
  mainEntity?: StructuredDataNode;
};

export type PlaceStructuredDataOptions = {
  venueName: string | null;
  venueAddress: string | null;
  city: string;
  country: string;
};

export type OfferStructuredDataOptions = {
  price: string;
  url: string;
  priceCurrency?: string;
  availability?: string;
};

export type EventStructuredDataOptions = {
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

export type ArticleStructuredDataOptions = {
  id: string;
  url: string;
  headline: string;
  description?: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
};
