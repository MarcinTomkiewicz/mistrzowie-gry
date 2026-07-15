import {
  OfferItemKindEnum,
  OfferPageTypeEnum,
  OfferPricingTypeEnum,
  OfferSectionTypeEnum,
} from '../enums/offers';

export type OfferPageType = `${OfferPageTypeEnum}`;
export type OfferSectionType = `${OfferSectionTypeEnum}`;
export type OfferItemKind = `${OfferItemKindEnum}`;
export type OfferPricingType = `${OfferPricingTypeEnum}`;

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
export type OfferItemPricing = {
  currency?: string | null;
  pricingNote?: string | null;
  min?: number | string | null;
  max?: number | string | null;
  monthlyMin?: number | string | null;
  monthlyMax?: number | string | null;
  hourlyMin?: number | string | null;
  hourlyMax?: number | string | null;
  total?: number | string | null;
  monthly?: number | string | null;
  perHour?: number | string | null;
  unit?: number | string | null;
  unitLabel?: string | null;
  minTotal?: number | string | null;
  surcharge?: number | string | null;
  percentSurcharge?: number | string | null;
  percentMin?: number | string | null;
  percentMax?: number | string | null;
};

export type PricingFormatted = {
  value: string;
  note?: string;
};

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
