import type { CommercialPrice } from './commercial-price';

export type CommercialPageKey =
  | 'individual-offer'
  | 'business-offer'
  | 'institution-offer'
  | 'event-offer'
  | 'standards-logistics';

export type CommercialPageKind = 'offer' | 'information';

export type CommercialTaxDisplayMode =
  | 'gross'
  | 'net'
  | 'audience_dependent'
  | 'none';

export type CommercialSectionType =
  | 'hero'
  | 'rich_text'
  | 'card_grid'
  | 'pricing_table'
  | 'process'
  | 'faq'
  | 'cta'
  | 'logistics_fees';

export type CommercialActionAppearance =
  | 'primary'
  | 'success'
  | 'secondary';

export type CommercialSharedSource =
  | {
      key: 'standards';
      locale: string;
      sectionType: 'card_grid';
    }
  | {
      key: 'logistics';
      locale: string;
      sectionType: 'logistics_fees';
    };

export type CommercialPageSeo = {
  title: string;
  description: string;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string | null;
};

export type CommercialPageIdentity = {
  id: string;
  key: CommercialPageKey;
  slug: string;
  locale: string;
  kind: CommercialPageKind;
  navigationLabel: string;
  taxDisplayMode: CommercialTaxDisplayMode;
};

export type CommercialPage = CommercialPageIdentity & {
  heading: string;
  lead: string | null;
  seo: CommercialPageSeo;
  effectiveFrom: string | null;
  publishedAt: string | null;
};

export type CommercialPageDocument = {
  page: CommercialPage;
  sections: CommercialPageSection[];
};

export type CommercialAction = {
  label: string;
  route: string;
  appearance: CommercialActionAppearance;
};

export type CommercialCapacity = {
  participantsMin: number | null;
  participantsMax: number | null;
  participantsPerFacilitatorMax: number | null;
  facilitatorCount: number | null;
  tableCount: number | null;
};

export type CommercialDurationMode = 'standard_session' | 'custom';

export type CommercialSchedule = {
  durationMode: CommercialDurationMode;
  durationMinutes: number | null;
  sessionCount: number | null;
  sessionsPerMonth: number | null;
  meetingCountMin: number | null;
  meetingCountMax: number | null;
};

type CommercialPricedItemBase = {
  id: string;
  position: number;
  title: string;
  body: string | null;
  capacity: CommercialCapacity | null;
  schedule: CommercialSchedule | null;
};

export type CommercialCardItem = CommercialPricedItemBase & {
  price: CommercialPrice | null;
};

export type CommercialPricingItem = CommercialPricedItemBase & {
  price: CommercialPrice;
};

export type CommercialProcessItem = {
  id: string;
  position: number;
  title: string;
  body: string;
};

export type CommercialFaqItem = {
  id: string;
  position: number;
  question: string;
  answer: string;
};

type CommercialSectionBase<TType extends CommercialSectionType> = {
  id: string;
  type: TType;
  position: number;
  heading: string | null;
  lead: string | null;
};

export type CommercialHeroSection = CommercialSectionBase<'hero'> & {
  body: string | null;
  action: CommercialAction | null;
};

export type CommercialRichTextSection = CommercialSectionBase<'rich_text'> & {
  body: string;
};

export type CommercialCardGridSection = CommercialSectionBase<'card_grid'> & {
  items: CommercialCardItem[];
};

export type CommercialPricingTableSection =
  CommercialSectionBase<'pricing_table'> & {
    items: CommercialPricingItem[];
  };

export type CommercialProcessSection = CommercialSectionBase<'process'> & {
  items: CommercialProcessItem[];
};

export type CommercialFaqSection = CommercialSectionBase<'faq'> & {
  items: CommercialFaqItem[];
};

export type CommercialCtaSection = CommercialSectionBase<'cta'> & {
  body: string | null;
  action: CommercialAction;
};

export type CommercialLogisticsFeesSection =
  CommercialSectionBase<'logistics_fees'> & {
    items: CommercialPricingItem[];
  };

export type CommercialPageSection =
  | CommercialHeroSection
  | CommercialRichTextSection
  | CommercialCardGridSection
  | CommercialPricingTableSection
  | CommercialProcessSection
  | CommercialFaqSection
  | CommercialCtaSection
  | CommercialLogisticsFeesSection;

export type StoredCommercialSharedSection<
  TType extends 'card_grid' | 'logistics_fees',
> = Pick<CommercialSectionBase<TType>, 'id' | 'type' | 'position'> & {
  heading?: never;
  lead?: never;
  items?: never;
  sharedSource: Extract<CommercialSharedSource, { sectionType: TType }>;
};

export type StoredCommercialCardGridSection =
  | (CommercialCardGridSection & { sharedSource?: never })
  | StoredCommercialSharedSection<'card_grid'>;

export type StoredCommercialLogisticsFeesSection =
  StoredCommercialSharedSection<'logistics_fees'>;

export type StoredCommercialSection =
  | CommercialHeroSection
  | CommercialRichTextSection
  | StoredCommercialCardGridSection
  | CommercialPricingTableSection
  | CommercialProcessSection
  | CommercialFaqSection
  | CommercialCtaSection
  | StoredCommercialLogisticsFeesSection;

export type StoredCommercialPageDocument = {
  heading: string;
  lead: string | null;
  seo: CommercialPageSeo;
  sections: StoredCommercialSection[];
};
