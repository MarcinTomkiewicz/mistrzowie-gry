import type { CommercialActionAppearance } from '../commercial-page';
import type {
  CommercialBlockType,
  CommercialButtonLayout,
  CommercialCardOrientation,
  CommercialEditorDuration,
  CommercialEditorParticipants,
  CommercialIconKey,
  CommercialProductCollectionBlock,
  CommercialSectionSurface,
  CommercialTextAlign,
} from '../commercial-page-builder';
import type {
  CommercialActualCostBasis,
  CommercialBillingUnit,
  CommercialPercentageBasis,
  CommercialPriceType,
} from '../commercial-price';

export type { AdminCommercialPagesRichContentTranslations } from './admin-commercial-rich-content';

export type AdminCommercialPagesListPageTranslations = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
  manageConstants: string;
};

export type AdminCommercialPagesListTableTranslations = {
  page: string;
  draftStatus: string;
  draftUpdatedAt: string;
  publication: string;
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

export type AdminCommercialPagesEditorStepsTranslations = {
  contentSeo: string;
  products: string;
  layout: string;
  previewSave: string;
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
  persistedBadge: string;
  persistedReady: string;
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

export type AdminCommercialPagesProductsTranslations = {
  sectionTitle: string;
  empty: string;
  addProduct: string;
  product: string;
  saveProduct: string;
};

export type AdminCommercialPagesProductTranslations = {
  name: string;
  description: string;
  durationSection: string;
  durationMode: string;
  durationMinutes: string;
  participantsSection: string;
  participantsMode: string;
  participantsMin: string;
  participantsMax: string;
  participantsPerFacilitatorMax: string;
  structureSection: string;
  sessions: string;
  sessionsPerMonth: string;
  meetingCountMin: string;
  meetingCountMax: string;
  facilitatorCount: string;
  tableCount: string;
};

export type AdminCommercialPagesSectionsTranslations = {
  sectionTitle: string;
  empty: string;
  addSection: string;
  section: string;
};

export type AdminCommercialPagesSectionTranslations = {
  heading: string;
  lead: string;
  surface: string;
  textAlign: string;
  blocks: string;
  emptyBlocks: string;
  addBlock: string;
};

export type AdminCommercialPagesButtonsTranslations = {
  layout: string;
  align: string;
  empty: string;
  add: string;
  label: string;
  route: string;
  appearance: string;
  iconKey: string;
  noIcon: string;
};

export type AdminCommercialPagesCardsTranslations = {
  orientation: string;
  columns: string;
  empty: string;
  add: string;
  title: string;
  body: string;
  hasPrice: string;
};

export type AdminCommercialPagesProductCollectionTranslations = {
  products: string;
  presentation: string;
  cardOrientation: string;
  columns: string;
  fields: string;
  fieldsHint: string;
  emptyFields: string;
  addField: string;
  fieldKey: string;
  fieldLabel: string;
  visibleProducts: string;
  labelOverrides: string;
  addLabelOverride: string;
  overrideProduct: string;
  overrideLabel: string;
  duplicateLabelOverride: string;
  staleProductReference: string;
  selectedCount: string;
  customizeField: string;
  hideCustomization: string;
  incompleteField: string;
};

export type AdminCommercialPagesTableTranslations = {
  columns: string;
  addColumn: string;
  columnHeading: string;
  rows: string;
  addRow: string;
  cell: string;
};

export type AdminCommercialPagesFaqTranslations = {
  empty: string;
  add: string;
  question: string;
  answer: string;
};

export type AdminCommercialPagesPriceTranslations = {
  sectionTitle: string;
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

export type AdminCommercialPagesEditorActionsTranslations = {
  saveDraft: string;
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
  invalidDuration: string;
  invalidParticipants: string;
  invalidMeetingRange: string;
  invalidRoute: string;
};

export type AdminCommercialPagesDraftStatusTranslations = {
  dirty: string;
  clean: string;
};

export type AdminCommercialPagesBlockTypeTranslations = Record<CommercialBlockType, string>;
export type AdminCommercialPagesSectionSurfaceTranslations = Record<CommercialSectionSurface, string>;
export type AdminCommercialPagesTextAlignTranslations = Record<CommercialTextAlign, string>;
export type AdminCommercialPagesButtonLayoutTranslations = Record<CommercialButtonLayout, string>;
export type AdminCommercialPagesCardOrientationTranslations = Record<CommercialCardOrientation, string>;
export type AdminCommercialPagesCollectionPresentationTranslations = Record<CommercialProductCollectionBlock['presentation']['type'], string>;
export type AdminCommercialPagesIconKeyTranslations = Record<CommercialIconKey, string>;
export type AdminCommercialPagesDurationModeTranslations = Record<CommercialEditorDuration['mode'], string>;
export type AdminCommercialPagesParticipantsModeTranslations = Record<CommercialEditorParticipants['mode'], string>;
export type AdminCommercialPagesActionAppearanceTranslations = Record<CommercialActionAppearance, string>;
export type AdminCommercialPagesPriceTypeTranslations = Record<CommercialPriceType, string>;
export type AdminCommercialPagesBillingUnitTranslations = Record<CommercialBillingUnit, string>;
export type AdminCommercialPagesPercentageBasisTranslations = Record<CommercialPercentageBasis, string>;
export type AdminCommercialPagesActualCostBasisTranslations = Record<CommercialActualCostBasis, string>;
