import type { CommercialActionAppearance } from '../commercial-page';
import type {
  CommercialBlockType,
  CommercialButtonLayout,
  CommercialCardOrientation,
  CommercialEditorDuration,
  CommercialEditorParticipants,
  CommercialProductKind,
  CommercialProductCollectionBlock,
  CommercialSessionCount,
  CommercialSectionSurface,
  CommercialTextAlign,
} from '../commercial-page-builder';

export type AdminCommercialPagesListPageTranslations = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
};

export type AdminCommercialPagesListTableTranslations = {
  page: string;
  draftStatus: string;
  draftUpdatedAt: string;
  effectiveFrom: string;
};

export type AdminCommercialPagesListToastTranslations = {
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
};

export type AdminCommercialPagesSeoTranslations = {
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
};

export type AdminCommercialPagesEditorToastTranslations = {
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
  dialogTitle: string;
  description: string;
  validate: string;
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
  product: string;
  saveProduct: string;
  addons: string;
};

export type AdminCommercialPagesProductTranslations = {
  kind: string;
  name: string;
  description: string;
  durationMode: string;
  durationMinutes: string;
  participantsMode: string;
  participantsMin: string;
  participantsMax: string;
  participantsPerFacilitatorMax: string;
  structureSection: string;
  sessionsMode: string;
  sessions: string;
  includedAddons: string;
  meetingCountMin: string;
  meetingCountMax: string;
};

export type AdminCommercialPagesSectionsTranslations = {
  sectionTitle: string;
  empty: string;
  section: string;
};

export type AdminCommercialPagesSectionTranslations = {
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
  route: string;
  appearance: string;
  iconKey: string;
  noIcon: string;
};

export type AdminCommercialPagesCardsTranslations = {
  cardOrientation: string;
  columnCount: string;
  empty: string;
  add: string;
  title: string;
  body: string;
  hasPrice: string;
};

export type AdminCommercialPagesProductCollectionTranslations = {
  products: string;
  presentation: string;
  fields: string;
  fieldsHint: string;
  emptyFields: string;
  addField: string;
  fieldKey: string;
  fieldLabel: string;
  visibleProducts: string;
  labelOverrides: string;
  addLabelOverride: string;
  overrideLabel: string;
  duplicateLabelOverride: string;
  staleProductReference: string;
  selectedCount: string;
  customizeField: string;
  hideCustomization: string;
  incompleteField: string;
  comparison: string;
  comparisonHint: string;
  emptyComparisonSections: string;
  addComparisonSection: string;
  comparisonSectionHeading: string;
  comparisonRows: string;
  emptyComparisonRows: string;
  comparisonRowLabel: string;
  comparisonRowFields: string;
  incompleteComparison: string;
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

export type AdminCommercialPagesEditorActionsTranslations = {
  moveSectionUp: string;
  moveSectionDown: string;
  removeSection: string;
};

export type AdminCommercialPagesValidationTranslations = {
  invalidDuration: string;
  invalidParticipants: string;
  invalidSessions: string;
  invalidIncludedAddons: string;
  invalidMeetingRange: string;
  invalidRoute: string;
};

export type AdminCommercialPagesDraftStatusTranslations = {
  dirty: string;
  clean: string;
};

export type AdminCommercialPagesBlockTypeTranslations = Record<
  Exclude<CommercialBlockType, 'cards' | 'table' | 'faq'>,
  string
>;
export type AdminCommercialPagesSectionSurfaceTranslations = Record<CommercialSectionSurface, string>;
export type AdminCommercialPagesTextAlignTranslations = Record<CommercialTextAlign, string>;
export type AdminCommercialPagesButtonLayoutTranslations = Record<CommercialButtonLayout, string>;
export type AdminCommercialPagesCardOrientationTranslations = Record<CommercialCardOrientation, string>;
export type AdminCommercialPagesCollectionPresentationTranslations = Record<
  Exclude<CommercialProductCollectionBlock['presentation']['type'], 'cards' | 'table'>,
  string
>;
export type AdminCommercialPagesDurationModeTranslations = Record<
  Exclude<CommercialEditorDuration['mode'], 'not_applicable'>,
  string
>;
export type AdminCommercialPagesParticipantsModeTranslations = Record<
  Exclude<CommercialEditorParticipants['mode'], 'not_applicable'>,
  string
>;
export type AdminCommercialPagesProductKindTranslations = Record<CommercialProductKind, string>;
export type AdminCommercialPagesSessionModeTranslations = Record<
  Exclude<CommercialSessionCount['mode'], 'not_applicable'>,
  string
>;
export type AdminCommercialPagesActionAppearanceTranslations = Record<CommercialActionAppearance, string>;
