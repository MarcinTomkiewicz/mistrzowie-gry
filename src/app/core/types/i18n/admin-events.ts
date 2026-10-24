import { EventOccurrenceStatus } from '../../enums/event';

export type ListPageCopy = {
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type CoreTableCopy = {
  noUpcomingOccurrences: string;
  noLocation: string;
  moreLocations: string;
};

export type ListActionsCopy = {
  createCore: string;
};

export type ListToastCopy = {
  activateSuccessSummary: string;
  activateSuccessDetail: string;
  deactivateSuccessSummary: string;
  deactivateSuccessDetail: string;
  activationFailedSummary: string;
};

export type EditorPageCopy = {
  createTitle: string;
  editTitle: string;
  subtitle: string;
  loadErrorTitle: string;
  notFoundTitle: string;
};

export type EditionEditorPageCopy = EditorPageCopy & {
  notFoundDescription: string;
};

export type EditorFieldsCopy = {
  coreSectionTitle: string;
  hasPublicPage: string;
};

export type EditorValidationCopy = {
  keyPattern: string;
  nameSlugSource: string;
};

export type EditionsCopy = {
  sectionTitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type EditionTableCopy = {
  defaultPublic: string;
};

export type EditorActionsCopy = {
  addEdition: string;
};

export type EditorToastCopy = {
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
};

export type CoreRpcErrorsCopy = {
  forbidden: string;
  notFound: string;
  invalid: string;
  duplicateKey: string;
  constraint: string;
  unknown: string;
};

export type EditionSectionsCopy = {
  identity: string;
  venueAndPrice: string;
  publication: string;
  signup: string;
};

export type EditionFieldsCopy = {
  slug: string;
  coverPreviewAlt: string;
  isDefaultPublic: string;
  defaultSlotCapacity: string;
  defaultParticipantCapacity: string;
};

export type EditionValidationCopy = {
  slugPattern: string;
  citySlugSource: string;
  slotCapacityRange: string;
  participantCapacityMin: string;
};

export type EditionCoverCopy = {
  saveFirst: string;
  publicImageInfo: string;
  cropHint: string;
  uploadFailedSummary: string;
  uploadFailedDetail: string;
  cleanupFailedSummary: string;
  cleanupFailedDetail: string;
};

export type EditionInfoCopy = {
  capacities: string;
  publicDefault: string;
  cityImmutable: string;
};

export type ParticipantKindCopy = {
  wholeEvent: string;
  programItem: string;
  both: string;
};

export type OccurrencesCopy = {
  sectionTitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type OccurrenceTableCopy = {
  hostSignupWindow: string;
  participantSignupWindow: string;
  programItemCount: string;
  activeParticipantCount: string;
};

export type OccurrenceDialogCopy = {
  title: string;
};

export type OccurrenceFieldsCopy = {
  hostSignupWindow: string;
  hostSignupOpensAt: string;
  hostSignupClosesAt: string;
  participantSignupWindow: string;
  participantSignupOpensAt: string;
  participantSignupClosesAt: string;
  openParticipantSignup: string;
  closeParticipantSignup: string;
  saveBeforeSignupChange: string;
};

export type OccurrenceValidationCopy = {
  hostSignupRange: string;
  participantSignupRange: string;
};

export type OccurrenceSignupStatusCopy = Record<
  Exclude<EventOccurrenceStatus, 'planned' | 'published' | 'archived'>,
  string
>;

export type OccurrenceToastCopy = {
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  reloadFailedSummary: string;
  signupChangeFailedSummary: string;
  signupReloadFailedSummary: string;
};

export type OccurrenceRpcErrorsCopy = {
  forbidden: string;
  notFound: string;
  invalid: string;
  constraint: string;
  conflict: string;
  unknown: string;
};

export type EditionRpcErrorsCopy = {
  forbidden: string;
  notFound: string;
  invalid: string;
  foreignKey: string;
  duplicateSlug: string;
  activeCityConflict: string;
  defaultPublicConflict: string;
  uniqueConflict: string;
  constraint: string;
  unknown: string;
};

export type ScheduleFieldsCopy = {
  dates: string;
  dateSelection: string;
  monthlyPosition: string;
  exclusionRules: string;
  addExclusionRule: string;
  allExcludedDates: string;
};

export type ScheduleOptionsCopy = {
  single: string;
  recurring: string;
  exactDates: string;
  range: string;
  individualDates: string;
  selectedDates: string;
  cyclic: string;
  singleHint: string;
  selectedDatesHint: string;
  cyclicHint: string;
  weeklyCycle: string;
};

export type ScheduleValidationCopy = {
  singleDate: string;
  exactDatesRequired: string;
  exactDatesInvalid: string;
  exactDatesDuplicate: string;
  recurrenceDates: string;
  recurrenceDateRange: string;
  weeklyDays: string;
  monthlyNth: string;
  monthlyWeekday: string;
  dayOfMonth: string;
  intervalMin: string;
  dateRangeLength: string;
  exclusionRule: string;
  allDatesExcluded: string;
};

export type ScheduleInfoCopy = {
  scheduleChange: string;
  protectedOccurrences: string;
  conflict: string;
  globalDates: string;
  exclusionRules: string;
};
