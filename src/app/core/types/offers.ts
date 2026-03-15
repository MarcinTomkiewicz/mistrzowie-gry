import {
  OfferItemKindEnum,
  OfferPageTypeEnum,
  OfferSectionTypeEnum,
} from '../enums/offers';

export type OfferPageType = `${OfferPageTypeEnum}`;
export type OfferSectionType = `${OfferSectionTypeEnum}`;
export type OfferItemKind = `${OfferItemKindEnum}`;

export type JsonObject = Record<string, unknown>;

export type OfferPageSeo = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
};

export type OfferPage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  position: number | null;
  type: OfferPageType;
  seo: OfferPageSeo;
  isActive: boolean;
  isTest: boolean;
};

export type OfferPageSectionDisplay = JsonObject;

export type OfferPageSection = {
  id: string;
  offerPageId: string;
  type: OfferSectionType;
  title: string | null;
  subtitle: string | null;
  itemKind: OfferItemKind | null;
  display: OfferPageSectionDisplay;
  position: number;
  isActive: boolean;
  isTest: boolean;
};

export type OfferItemMeta = JsonObject;
export type OfferItemPricing = JsonObject;

export type OfferItem = {
  id: number;
  title: string;
  slug: string | null;
  kind: OfferItemKind;
  lead: string | null;
  body: string | null;
  meta: OfferItemMeta;
  pricing: OfferItemPricing;
  position: number;
  isActive: boolean;
  isTest: boolean;
};

export type OfferSectionItem = {
  id: string;
  sectionId: string;
  offerItemId: number;
  position: number;
};

export type OfferPageVm = {
  page: OfferPage;
  sections: OfferSectionWithItems[];
};

export type OfferSectionWithItems = OfferPageSection & {
  items: OfferItem[];
};

export type OfferPageDbRow = OfferPage & {
  offerPageSections?: Array<
    OfferPageSection & {
      offerPageSectionItems?: Array<
        OfferSectionItem & {
          offerItems?: OfferItem | null;
        }
      >;
    }
  >;
};

export type OfferItemId = OfferItem['id'];