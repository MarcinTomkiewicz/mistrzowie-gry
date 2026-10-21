import type { EVENT_CURRENCIES, EVENT_PRICE_BASES } from '../configs/events.config';
import type { ParticipantSignupKind } from '../enums/event';
import type { EventMonthlyNth } from '../types/event';
import type { IEventExactDatesSchedule, IEventRecurringSchedule, IEventSingleSchedule } from './i-event-schedule';

export type EventCurrency = (typeof EVENT_CURRENCIES)[number];
export type EventPriceBasis = (typeof EVENT_PRICE_BASES)[number];

type GlobalRecurrence = Pick<IEventRecurringSchedule, 'kind' | 'interval' | 'startDate' | 'endDate'> & {
  exdates?: string[];
};

export type EventGlobalSchedule = IEventSingleSchedule | IEventExactDatesSchedule | (GlobalRecurrence & (
  | { recurrenceKind: 'WEEKLY'; byweekday: number[] }
  | { recurrenceKind: 'MONTHLY_DAY_OF_MONTH'; dayOfMonth: number }
  | { recurrenceKind: 'MONTHLY_NTH_WEEKDAY'; monthlyNth: EventMonthlyNth | 5; monthlyWeekday: number }
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
  policy: EventGlobalPolicyInput;
}

export interface AdminGlobalCalendarResult {
  coreId: string;
  coreKey: string;
  mainEditionId: string;
  calendarLifecycle: string;
  calendarRevision: number;
  draftRevision: number;
  pendingDraft: null | {
    revision: number;
    schedule: EventGlobalSchedule;
    timeBlocks: GlobalTimeBlockInput[];
    cityExclusions: unknown;
    candidateDates: string[];
    updatedAt: string;
  };
  schedule: EventGlobalSchedule;
  cities: {
    editionId: string; city: string; slug: string; timezone: string;
    isMain: boolean; isActive: boolean; isDefaultPublicLegacy: boolean;
  }[];
  timeBlocks: (GlobalTimeBlockInput & { blockId: string })[];
  globalDates: {
    globalOccurrenceId: string;
    date: string;
    status: string;
    cityOccurrences: {
      editionId: string; city: string; decision: string;
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
