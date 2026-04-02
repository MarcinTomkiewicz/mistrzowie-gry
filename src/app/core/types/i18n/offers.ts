export type OfferPricingHeadersTranslations = {
  variant: string;
  variantLabel: string;
  price: string;
  description: string;
};

export type OfferFootnotesTranslations = {
  net: string;
  gross: string;
  both: string;
};

export type StandardsAndLogisticsFaqItem = {
  h: string;
  a: string;
};

export type StandardsAndLogisticsCardItem = {
  title: string;
  lead: string;
};

export type StandardsAndLogisticsPricingItem = {
  title: string;
  value?: string;
  note?: string;
};

export type StandardsAndLogisticsSection<TItem> = {
  title?: string;
  subtitle?: string;
  items?: TItem[];
};

export type StandardsAndLogisticsDict = {
  intro?: {
    title?: string;
    subtitle?: string;
  };
  standard?: StandardsAndLogisticsSection<StandardsAndLogisticsCardItem>;
  logistics?: StandardsAndLogisticsSection<StandardsAndLogisticsPricingItem>;
  faq?: StandardsAndLogisticsSection<StandardsAndLogisticsFaqItem>;
};
