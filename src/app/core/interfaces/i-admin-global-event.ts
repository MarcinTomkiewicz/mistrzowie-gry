import type { EVENT_CURRENCIES, EVENT_PRICE_BASES } from '../configs/events.config';
import type { ParticipantSignupKind } from '../enums/event';
import type { EventMonthlyNth } from '../types/event';
import type { IEventExactDatesSchedule, IEventRecurringSchedule, IEventSingleSchedule } from './i-event-schedule';
import type { IAdminEventDetail } from './i-event-admin';

export type EventCurrency = (typeof EVENT_CURRENCIES)[number];
export type EventPriceBasis = (typeof EVENT_PRICE_BASES)[number];

type GlobalRecurrence = Pick<IEventRecurringSchedule, 'kind' | 'interval' | 'startDate' | 'endDate'> & {
  exdates: string[];
};

export type EventGlobalSchedule = IEventSingleSchedule | IEventExactDatesSchedule | (GlobalRecurrence & (
  | { recurrenceKind: 'WEEKLY'; byweekday: number[] }
  | { recurrenceKind: 'MONTHLY_DAY_OF_MONTH'; dayOfMonth: number }
  | { recurrenceKind: 'MONTHLY_NTH_WEEKDAY'; monthlyNth: EventMonthlyNth; monthlyWeekday: number }
));

export interface GlobalTimeBlockInput {
  position: number;
  label: string;
  requiredGmCount: number;
  startDayOffset: number;
  startTime: string;
  endDayOffset: number;
  endTime: string;
}

export interface EventGlobalBaseTimeBlocksCommand {
  coreId: string;
  expectedCalendarRevision: number;
  timeBlocks: GlobalTimeBlockInput[];
}

type GlobalBaseTimeBlocksPreviewData = {
  applied: false;
  published: false;
  participantSignupOpened: false;
  appliedToPublic?: false;
  changed?: boolean;
  coreId?: string;
  calendarRevision?: number;
  timeBlocks?: GlobalTimeBlockInput[];
  fieldErrors: unknown[];
  blockers: unknown[];
  impact?: {
    previousBaseBlockCount: number;
    proposedBaseBlockCount: number;
    affectedEditionCount: number;
    affectedPlannedOccurrenceCount: number;
    scheduledGlobalDateCount: number;
    preservedDateOverrides: number;
    preservedCityOverrides: number;
    derivedEnvelope: { startTime: string; endTime: string; endDayOffset: number; legacySlotCapacity: number };
  };
};

export type AdminGlobalBaseTimeBlocksPreview = GlobalBaseTimeBlocksPreviewData & (
  | { valid: true; status: 'preview_ready' }
  | { valid: true; status: 'unchanged' }
  | { valid: false; status: 'blocked' }
  | { valid: false; status: 'invalid' }
);

export type AdminGlobalBaseTimeBlocksSave = {
  coreId: string;
  calendarRevision?: number;
  timeBlocks?: GlobalTimeBlockInput[];
  preview: AdminGlobalBaseTimeBlocksPreview;
  published: false;
  participantSignupOpened: false;
  appliedToPublic: false;
} & (
  | { saved: true; status: 'applied' }
  | { saved: true; status: 'unchanged' }
  | { saved: false; status: 'blocked' }
  | { saved: false; status: 'invalid' }
);

export interface CityExclusion {
  editionId: string;
  date: string;
}

export interface EventGlobalCalendarChange {
  coreId: string;
  schedule: EventGlobalSchedule;
  timeBlocks: GlobalTimeBlockInput[];
  cityExclusions: CityExclusion[];
}

export interface AdminGlobalCalendarImpact {
  addedDates: string[];
  retirableUnprotectedDates: string[];
  preservedHistoricalDates: string[];
  affectedCityCount: number;
  existingParticipantRows: number;
}

export type AdminGlobalCalendarFullPreview = EventGlobalCalendarChange & {
  fieldErrors: [];
  blockers: { code: string }[];
  candidateDates: string[];
  impact: AdminGlobalCalendarImpact;
  currentDraftRevision: number;
  appliedToPublic: false;
  published: false;
} & ({ valid: true; status: 'draft_ready' } | { valid: false; status: 'blocked' });

export type AdminGlobalCalendarPreview = AdminGlobalCalendarFullPreview | {
  valid: false;
  status: 'invalid';
  fieldErrors: {
    field: 'schedule' | 'timeBlocks' | 'cityExclusions';
    code: 'INVALID_GLOBAL_SCHEDULE' | 'INVALID_TIME_BLOCKS' | 'INVALID_CITY_EXCLUSIONS';
    detail?: string;
  }[];
  blockers: [];
  appliedToPublic: false;
};

export type AdminGlobalCalendarSave = {
  coreId: string;
  revision: number;
  calendarLifecycle: 'shadow' | 'global';
} & (
  | { saved: true; status: 'draft_saved'; appliedToPublic: false;
      preview: Extract<AdminGlobalCalendarFullPreview, { valid: true }> }
  | { saved: false; status: 'blocked'; preview: Extract<AdminGlobalCalendarPreview, { valid: false }> }
);

export interface AdminGlobalCalendarApply {
  applied: true;
  published: false;
  coreId: string;
  calendarLifecycle: 'global';
  calendarRevision: number;
  appliedDraftRevision: number;
  createdLocalOccurrences: number;
  removedPlannedOccurrences: number;
  retiredGlobalDates: number;
  excludedCityDates: number;
  participantSignupOpened: false;
  appliedToPublic: false;
  impact: AdminGlobalCalendarImpact;
}

export interface EventDateTimeBlocks {
  date: string;
  timeBlocks: GlobalTimeBlockInput[];
}

export interface EventDateTimeBlocksChange {
  date: string;
  timeBlocks: GlobalTimeBlockInput[] | null;
}

export interface EventCityDateTimeBlocksChange extends EventDateTimeBlocksChange {
  editionId: string;
}

export interface EventDatedTimeBlocksCommand {
  coreId: string;
  expectedCalendarRevision: number;
  dateTimeBlocks: EventDateTimeBlocksChange[];
  cityDateTimeBlocks: EventCityDateTimeBlocksChange[];
}

export interface AdminDatedTimeBlocksPreview {
  valid: true;
  status: 'preview_ready';
  applied: false;
  coreId: string;
  calendarRevision: number;
  dateTimeBlocks: EventDateTimeBlocksChange[];
  cityDateTimeBlocks: EventCityDateTimeBlocksChange[];
  published: false;
  participantSignupOpened: false;
}

export interface AdminDatedTimeBlocksSave {
  status: 'draft_saved';
  applied: true;
  calendarRevision: number;
  dateTimeBlocks: EventDateTimeBlocksChange[];
  cityDateTimeBlocks: EventCityDateTimeBlocksChange[];
}

export interface AdminDatedTimeBlocks extends EventDateTimeBlocks {
  globalOccurrenceId: string;
  source: 'published_snapshot' | 'date_specific' | 'core_baseline';
  cities: {
    editionId: string;
    city: string;
    isOverride: boolean;
    publishedSnapshot: boolean;
    timeBlocks: GlobalTimeBlockInput[];
  }[];
}

export interface EventGlobalPrice {
  amount: number | null;
  currency: EventCurrency;
  basis: EventPriceBasis | null;
}

export interface EventGlobalPolicyInput {
  price: EventGlobalPrice;
  coverImagePath: string | null;
  isForBeginners: boolean;
  participantSignupKind: ParticipantSignupKind;
  signupRequired: boolean;
  sessionCapacityCeiling: number | null;
  wholeEventCapacity: number | null;
}

export interface CreateAdminGlobalEventPayload {
  coreId?: string;
  mainEditionId?: string;
  name: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  mainCity: {
    city: string;
    venueName?: string | null;
    venueAddress?: string | null;
    timezone: string;
    facebookLink?: string | null;
  };
  schedule: EventGlobalSchedule;
  timeBlocks: GlobalTimeBlockInput[];
  dateTimeBlocks?: EventDateTimeBlocks[];
  mainCityDateTimeBlocks?: EventDateTimeBlocks[];
  policy: EventGlobalPolicyInput;
}

export type AddAdminGlobalEventCityPayload = CreateAdminGlobalEventPayload['mainCity'];

export type AdminGlobalEventCityBlocker = 'checking' | 'calendar' | 'coreActive' | 'corePublic' | 'activeCity' |
  'protectedDates' | 'occurrenceStatus' | 'calendarStatus' | 'noScheduledDates';

export type AdminGlobalEventEditionMetadata = Pick<IAdminEventDetail, 'venueName' | 'venueAddress' | 'facebookLink'>;

export type SaveAdminGlobalEventEditionMetadataPayload = {
  editionId: string;
  expectedUpdatedAt: string;
} & Partial<AdminGlobalEventEditionMetadata>;

export interface SaveAdminGlobalEventEditionMetadataResult {
  saved: boolean;
  alreadyApplied: boolean;
  coreId: string;
  editionId: string;
  updatedAt: string;
  metadata: AdminGlobalEventEditionMetadata;
}

export interface AddAdminGlobalEventCityResult {
  created: boolean;
  replayed: boolean;
  coreId: string;
  editionId: string;
  calendar: AdminGlobalCalendarResult;
  policy: AdminEffectivePolicyResult;
}

export interface AdminGlobalCalendarResult {
  coreId: string;
  coreKey: string;
  mainEditionId: string;
  calendarLifecycle: 'shadow' | 'global';
  calendarRevision: number;
  draftRevision: number;
  pendingDraft: null | {
    revision: number;
    schedule: EventGlobalSchedule;
    timeBlocks: GlobalTimeBlockInput[];
    cityExclusions: CityExclusion[];
    candidateDates: string[];
    updatedAt: string;
  };
  schedule: EventGlobalSchedule;
  cities: {
    editionId: string; city: string; slug: string; timezone: string;
    isMain: boolean; isActive: boolean; isDefaultPublicLegacy: boolean;
  }[];
  timeBlocks: (GlobalTimeBlockInput & { blockId: string })[];
  datedTimeBlocks: AdminDatedTimeBlocks[];
  globalDates: {
    globalOccurrenceId: string;
    date: string;
    status: 'scheduled' | 'cancelled';
    cityOccurrences: {
      editionId: string; city: string; decision: 'included' | 'excluded' | 'unspecified';
      occurrenceId: string | null; occurrenceStatus: string | null;
      publishedAt: string | null; protected: boolean; unlinkedSameDate: boolean;
    }[];
  }[];
  revision: string;
}

export interface AdminEffectivePolicyResult {
  coreId: string;
  coreKey: string;
  mainEditionId: string;
  lifecycle: string;
  backfillSourceEditionId: string;
  policyRevision: number;
  global: EventGlobalPolicyInput;
  editions: {
    editionId: string; city: string; slug: string; isMain: boolean; isActive: boolean;
    override: {
      price: boolean; cover: boolean; signup: boolean;
      sessionCapacityCeiling: boolean; wholeEventCapacity: boolean;
    };
    localValues: {
      price: Omit<EventGlobalPrice, 'currency'> & { currency: EventCurrency | null };
      coverImagePath: string | null;
      participantSignupKind: ParticipantSignupKind | null;
      signupRequired: boolean | null;
      sessionCapacityCeiling: number | null;
      wholeEventCapacity: number | null;
    };
    effective: EventGlobalPolicyInput;
  }[];
  appliedToPublicEvent: boolean;
  appliedToParticipantRegistration: boolean;
  revision: string;
}

type GlobalEventCreation = {
  created: true;
  published: false;
  requestId: string;
  coreId: string;
  mainEditionId: string;
  calendar: AdminGlobalCalendarResult;
  policy: AdminEffectivePolicyResult;
};

export type CreateAdminGlobalEventResult = GlobalEventCreation & (
  | {
      replayed: false; participantSignupOpened: false;
      coreKey: string; mainEditionSlug: string;
      calendarLifecycle: 'global'; localOccurrenceCount: number;
    }
  | { replayed: true }
);
