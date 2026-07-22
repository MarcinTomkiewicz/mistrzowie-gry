import { EventOccurrenceStatus } from '../../enums/event';

export type ListPageCopy = {
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptyDescription: string;
  loadErrorTitle: string;
};

export type CoreTableCopy = {
  name: string;
  key: string;
  shortDescription: string;
  active: string;
  publicPage: string;
  displayOrder: string;
  editionCount: string;
  activeEditionCount: string;
  updatedAt: string;
};

export type ListActionsCopy = {
  createCore: string;
  activateCore: string;
  deactivateCore: string;
};

export type ListToastCopy = {
  loadFailedSummary: string;
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
  key: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  isActive: string;
  hasPublicPage: string;
  displayOrder: string;
};

export type EditorValidationCopy = {
  keyPattern: string;
  displayOrderMin: string;
};

export type EditionsCopy = {
  sectionTitle: string;
  emptyTitle: string;
  emptyDescription: string;
};

export type EditionTableCopy = {
  city: string;
  slug: string;
  active: string;
  defaultPublic: string;
  displayOrder: string;
  occurrenceCount: string;
  programItemCount: string;
};

export type EditorActionsCopy = {
  addEdition: string;
};

export type EditorToastCopy = {
  loadFailedSummary: string;
  saveSuccessSummary: string;
  saveSuccessDetail: string;
  saveFailedSummary: string;
};

export type StatusCopy = {
  active: string;
  inactive: string;
};

export type CoreRpcErrorsCopy = {
  forbidden: string;
  notFound: string;
  invalid: string;
  duplicateKey: string;
  constraint: string;
  conflict: string;
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
  eventCore: string;
  slug: string;
  city: string;
  venueName: string;
  venueAddress: string;
  priceAmount: string;
  priceCurrency: string;
  priceLabel: string;
  coverImagePath: string;
  coverPreviewAlt: string;
  facebookLink: string;
  isActive: string;
  isDefaultPublic: string;
  displayOrder: string;
  isForBeginners: string;
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
  priceAmountMin: string;
  displayOrderMin: string;
  timeRange: string;
  slotCapacityRange: string;
  participantCapacityMin: string;
  coverImagePath: string;
};

export type EditionInfoCopy = {
  capacities: string;
  publicDefault: string;
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
  date: string;
  status: string;
  slotCapacity: string;
  participantCapacity: string;
  participantSignupKind: string;
  hostSignupWindow: string;
  participantSignupWindow: string;
  publishedAt: string;
  programItemCount: string;
  activeParticipantCount: string;
};

export type OccurrenceDialogCopy = {
  title: string;
};

export type OccurrenceFieldsCopy = {
  date: string;
  status: string;
  slotCapacity: string;
  participantCapacity: string;
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

export type OccurrenceStatusCopy = Record<EventOccurrenceStatus, string>;

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
  conflict: string;
  unknown: string;
};

export type ScheduleFieldsCopy = {
  sectionTitle: string;
  kind: string;
  date: string;
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
  weekly: string;
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
