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

export type EditionFieldsCopy = {
  coverPreviewAlt: string;
  isDefaultPublic: string;
  defaultSlotCapacity: string;
  defaultParticipantCapacity: string;
};

export type EditionValidationCopy = {
  citySlugSource: string;
};

export type CoreCoverCopy = {
  info: string;
  cropHint: string;
  previewAlt: string;
  save: string;
  saved: string;
  metadataFirst: string;
  readOnly: string;
  uncertain: string;
  cleanupFailed: string;
  conflict: string;
  abandonConfirm: string;
  abandonCleanupConfirm: string;
  abandonAction: string;
  abandoned: string;
  cleanupAbandoned: string;
  refreshFailed: string;
  refreshRequired: string;
};

export type ParticipantKindCopy = {
  wholeEvent: string;
  programItem: string;
  both: string;
};

export type OccurrencesCopy = {
  sectionTitle: string;
  emptyDescription: string;
};

export type OccurrenceTableCopy = {
  programItemCount: string;
};

export type OccurrenceSignupStatusCopy = Record<
  Exclude<EventOccurrenceStatus, 'planned' | 'published' | 'archived'>,
  string
>;

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
  fifth: string;
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
  globalDates: string;
  exclusionRules: string;
};
