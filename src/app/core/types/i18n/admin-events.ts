import { EventOccurrenceStatus } from '../../enums/event';

export type ListPageCopy = {
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type CoreTableCopy = {
  nextOccurrence: string;
  location: string;
  publicPage: string;
  noUpcomingOccurrences: string;
  noLocation: string;
  moreLocations: string;
};

export type ListActionsCopy = {
  createCore: string;
  activateCore: string;
  deactivateCore: string;
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
  notFoundDescription: string;
};

export type EditorFieldsCopy = {
  coreSectionTitle: string;
  longDescription: string;
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
  active: string;
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

export type StatusCopy = {
  inactive: string;
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
  cover: string;
};

export type EditionFieldsCopy = {
  slug: string;
  venueName: string;
  venueAddress: string;
  priceCurrency: string;
  priceLabel: string;
  coverPreviewAlt: string;
  facebookLink: string;
  isActive: string;
  isDefaultPublic: string;
  timezone: string;
  startTime: string;
  endTime: string;
  participantSignupKind: string;
  signupRequired: string;
  defaultSlotCapacity: string;
  defaultParticipantCapacity: string;
};

export type EditionValidationCopy = {
  slugPattern: string;
  citySlugSource: string;
  priceAmountMin: string;
  timeRange: string;
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
  slotCapacity: string;
  hostSignupWindow: string;
  participantSignupWindow: string;
  programItemCount: string;
  activeParticipantCount: string;
};

export type OccurrenceDialogCopy = {
  title: string;
};

export type OccurrenceFieldsCopy = {
  date: string;
  slotCapacity: string;
  participantSignupKind: string;
  hostSignupWindow: string;
  hostSignupOpensAt: string;
  hostSignupClosesAt: string;
  participantSignupWindow: string;
  participantSignupOpensAt: string;
  participantSignupClosesAt: string;
};

export type OccurrenceValidationCopy = {
  timestamp: string;
  hostSignupRange: string;
  participantSignupRange: string;
};

export type OccurrenceStatusCopy = Record<
  Exclude<EventOccurrenceStatus, 'published' | 'archived'>,
  string
>;

export type OccurrenceToastCopy = {
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
  reloadFailedSummary: string;
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
  sectionTitle: string;
  kind: string;
  date: string;
  dates: string;
  recurrenceKind: string;
  interval: string;
  byweekday: string;
  monthlyNth: string;
  monthlyWeekday: string;
  dayOfMonth: string;
  startDate: string;
  endDate: string;
  exdates: string;
  exdate: string;
};

export type ScheduleOptionsCopy = {
  single: string;
  recurring: string;
  exactDates: string;
  monthlyNthWeekday: string;
  monthlyDayOfMonth: string;
  first: string;
  second: string;
  third: string;
  fourth: string;
  last: string;
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
  exdate: string;
};

export type ScheduleInfoCopy = {
  scheduleChange: string;
  protectedOccurrences: string;
  conflict: string;
};
