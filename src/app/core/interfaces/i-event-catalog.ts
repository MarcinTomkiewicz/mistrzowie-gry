export interface IPublicEventCatalogItem {
  coreId: string;
  coreKey: string;
  name: string;
  shortDescription: string | null;
  coverImagePath: string | null;
  nextOccurrenceDate: string;
  editions: IPublicEventCatalogEdition[];
}

export interface IPublicEventCatalogEdition {
  id: string;
  slug: string;
  city: string;
  venueName: string | null;
  coverImagePath: string | null;
  isDefaultPublic: boolean;
  nextOccurrenceDate: string;
}

export interface IHostEventCatalogItem {
  id: string;
  key: string;
  name: string;
  shortDescription: string | null;
  longDescription: string | null;
  displayOrder: number;
  editions: IHostEventEdition[];
}

export interface IHostEventEdition {
  id: string;
  slug: string;
  city: string;
  venueName: string | null;
  venueAddress: string | null;
  timezone: string;
  startTime: string;
  endTime: string;
  isForBeginners: boolean;
  displayOrder: number;
}
