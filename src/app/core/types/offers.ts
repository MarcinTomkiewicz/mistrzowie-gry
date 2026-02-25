export type OfferPageType = 'individual' | 'business' | 'institution' | 'event';
export type OfferSectionType = 'hero' | 'highlights' | 'cards' | 'pricing_table' | 'timeline' | 'faq' | 'seo_text' | 'cta';
export type OfferItemKind = 'core' | 'addon' | 'material' | 'other';

export type OfferPage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  position: number | null;
  type: OfferPageType;
  seo: Record<string, any>;
  isActive: boolean;
  isTest: boolean;
};

export type OfferPageSection = {
  id: string;
  offerPageId: string;
  type: OfferSectionType;
  title: string | null;
  subtitle: string | null;
  itemKind: OfferItemKind | null;
  display: Record<string, any>;
  position: number;
  isActive: boolean;
  isTest: boolean;
};

export type OfferItem = {
  id: number;
  title: string;
  slug: string | null;
  kind: OfferItemKind;
  lead: string | null;
  body: string | null;
  meta: Record<string, any>;
  pricing: Record<string, any>;
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
  sections: Array<OfferPageSection & { items: OfferItem[] }>;
};
