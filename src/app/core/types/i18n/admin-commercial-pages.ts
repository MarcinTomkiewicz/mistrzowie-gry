import type {
  CommercialActionAppearance,
  CommercialDurationMode,
  CommercialPageKind,
  CommercialSectionType,
  CommercialSharedSource,
  CommercialTaxDisplayMode,
} from '../commercial-page';
import type {
  CommercialActualCostBasis,
  CommercialBillingUnit,
  CommercialPercentageBasis,
  CommercialPriceType,
} from '../commercial-price';

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
  publishedBy: string;
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

export type AdminCommercialPagesPreviewPageTranslations = {
  seoTitle: string;
  badge: string;
  loadErrorTitle: string;
  loadErrorDescription: string;
  backToEditor: string;
};

export type AdminCommercialPagesPublicationTranslations = {
  sectionTitle: string;
  dialogTitle: string;
  description: string;
  effectiveFrom: string;
  validate: string;
  preview: string;
  publish: string;
  validationReady: string;
  validationIssues: string;
  issuePath: string;
};

export type AdminCommercialPagesPublicationMetadataTranslations = {
  sectionTitle: string;
  draftRevision: string;
  previewedRevision: string;
  draftUpdatedAt: string;
  draftUpdatedBy: string;
  publishedAt: string;
  publishedBy: string;
  effectiveFrom: string;
};

export type AdminCommercialPagesPublicationToastTranslations = {
  validationReadySummary: string;
  validationReadyDetail: string;
  validationBlockedSummary: string;
  validationBlockedDetail: string;
  validationFailedSummary: string;
  validationFailedDetail: string;
  publishSuccessSummary: string;
  publishSuccessDetail: string;
  publishFailedSummary: string;
  publishFailedDetail: string;
};

export type AdminCommercialPagesSectionsTranslations = {
  sectionTitle: string;
  empty: string;
  addSection: string;
  sharedNotice: string;
  sharedSource: string;
};

export type AdminCommercialPagesSectionBaseTranslations = {
  heading: string;
  lead: string;
};

export type AdminCommercialPagesItemsTranslations = {
  empty: string;
  addItem: string;
  title: string;
  body: string;
  question: string;
  answer: string;
};

export type AdminCommercialPagesActionTranslations = {
  sectionTitle: string;
  enabled: string;
  label: string;
  route: string;
  appearance: string;
};

export type AdminCommercialPagesPriceTranslations = {
  sectionTitle: string;
  enabled: string;
  type: string;
  amount: string;
  minAmount: string;
  maxAmount: string;
  value: string;
  minValue: string;
  maxValue: string;
  unit: string;
  basis: string;
  note: string;
};

export type AdminCommercialPagesCapacityTranslations = {
  sectionTitle: string;
  enabled: string;
  participantsMin: string;
  participantsMax: string;
  participantsPerFacilitatorMax: string;
  facilitatorCount: string;
  tableCount: string;
};

export type AdminCommercialPagesScheduleTranslations = {
  sectionTitle: string;
  enabled: string;
  durationMode: string;
  durationMinutes: string;
  sessionCount: string;
  sessionsPerMonth: string;
  meetingCountMin: string;
  meetingCountMax: string;
};

export type AdminCommercialPagesEditorActionsTranslations = {
  moveSectionUp: string;
  moveSectionDown: string;
  removeSection: string;
  moveItemUp: string;
  moveItemDown: string;
  removeItem: string;
};

export type AdminCommercialPagesValidationTranslations = {
  invalidPrice: string;
  invalidPriceRange: string;
  invalidPercentage: string;
  priceNoteRequired: string;
  invalidCapacity: string;
  invalidSchedule: string;
  invalidRoute: string;
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

export type AdminCommercialPagesSectionTypeTranslations = Record<
  CommercialSectionType,
  string
>;

export type AdminCommercialPagesSharedSourceTranslations = Record<
  CommercialSharedSource['key'],
  string
>;

export type AdminCommercialPagesActionAppearanceTranslations = Record<
  CommercialActionAppearance,
  string
>;

export type AdminCommercialPagesPriceTypeTranslations = Record<
  CommercialPriceType,
  string
>;

export type AdminCommercialPagesBillingUnitTranslations = Record<
  CommercialBillingUnit,
  string
>;

export type AdminCommercialPagesPercentageBasisTranslations = Record<
  CommercialPercentageBasis,
  string
>;

export type AdminCommercialPagesActualCostBasisTranslations = Record<
  CommercialActualCostBasis,
  string
>;

export type AdminCommercialPagesDurationModeTranslations = Record<
  CommercialDurationMode,
  string
>;
