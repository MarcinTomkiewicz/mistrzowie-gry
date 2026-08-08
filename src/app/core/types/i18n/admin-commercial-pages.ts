import type {
  CommercialPageKind,
  CommercialTaxDisplayMode,
} from '../commercial-page';

export type AdminCommercialPagesListPageTranslations = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
};

export type AdminCommercialPagesListTableTranslations = {
  navigationLabel: string;
  heading: string;
  slug: string;
  locale: string;
  draftStatus: string;
  draftUpdatedAt: string;
  publishedAt: string;
  effectiveFrom: string;
};

export type AdminCommercialPagesListToastTranslations = {
  loadFailedSummary: string;
  loadFailedDetail: string;
};

export type AdminCommercialPagesEditorPageTranslations = {
  title: string;
  subtitle: string;
  loadErrorTitle: string;
};

export type AdminCommercialPagesIdentityTranslations = {
  sectionTitle: string;
  key: string;
  navigationLabel: string;
  slug: string;
  locale: string;
  kind: string;
  taxDisplayMode: string;
};

export type AdminCommercialPagesMetadataTranslations = {
  sectionTitle: string;
  heading: string;
  lead: string;
};

export type AdminCommercialPagesSeoTranslations = {
  sectionTitle: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
};

export type AdminCommercialPagesEditorToastTranslations = {
  loadFailedSummary: string;
  loadFailedDetail: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  saveFailedDetail: string;
};

export type AdminCommercialPagesDraftStatusTranslations = {
  dirty: string;
  clean: string;
};

export type AdminCommercialPagesKindTranslations = Record<
  CommercialPageKind,
  string
>;

export type AdminCommercialPagesTaxDisplayModeTranslations = Record<
  CommercialTaxDisplayMode,
  string
>;
