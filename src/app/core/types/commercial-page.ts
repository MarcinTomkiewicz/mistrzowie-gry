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

export type CommercialActionAppearance =
  | 'primary'
  | 'success'
  | 'secondary';

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
