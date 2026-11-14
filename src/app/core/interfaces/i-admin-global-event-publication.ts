import type { AdminEffectivePolicyResult, AdminGlobalCalendarResult } from './i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail } from './i-event-admin';
import type { IEventParticipantAvailability } from './i-event-participant';

export const GLOBAL_PUBLICATION_BLOCKER_CODES = [
  'GLOBAL_CALENDAR_REQUIRED', 'CORE_NOT_PRIVATE_DRAFT', 'STAFFING_PUBLICATION_IS_SEPARATE',
  'PARTICIPANT_RELEASE_MUST_BE_OFF', 'UNAPPROVED_FUTURE_BLUEPRINT', 'PENDING_CALENDAR_DRAFT',
  'MAIN_EDITION_MISSING', 'INVALID_MAIN_EDITION_DEFAULT', 'CORE_PUBLIC_METADATA_INCOMPLETE',
  'STALE_POLICY_DRAFT', 'NO_GLOBAL_DATES', 'NO_PUBLISHABLE_OCCURRENCES', 'INVALID_GLOBAL_SLOT_ENVELOPE',
  'INVALID_POLICY_DRAFT', 'EDITION_NOT_PRIVATE_DRAFT', 'EDITION_PUBLIC_METADATA_INCOMPLETE',
  'EDITION_GLOBAL_TIME_MISMATCH', 'EDITION_POLICY_MISSING', 'INCOMPATIBLE_EFFECTIVE_SIGNUP_POLICY',
  'EDITION_HAS_NO_FUTURE_OCCURRENCE', 'EXCLUDED_CITY_HAS_OCCURRENCE', 'CITY_OCCURRENCE_NOT_PUBLICATION_READY',
  'PREEXISTING_PUBLIC_EVENT_DATA', 'INVALID_CITY_DST_TIME', 'INVALID_REAL_BLOCK_DURATION',
] as const;

export interface AdminGlobalPublicationBlocker {
  code: (typeof GLOBAL_PUBLICATION_BLOCKER_CODES)[number];
  editionId?: string;
  date?: string;
  blockPosition?: number;
  totalSlots?: number;
  fieldErrors?: unknown[];
  policyBlockers?: unknown[];
}

export interface AdminGlobalPublicationOccurrence {
  editionId: string;
  occurrenceId: string;
  date: string;
}

export type GlobalPublicationStep = 'publication' | 'program' | 'signup';

export interface GlobalPublicationSignupReadback {
  outcome: 'available' | 'full' | 'no_scope' | 'scheduled' | 'past' | 'denied';
  items: readonly IEventParticipantAvailability[];
}

export type GlobalPublicationStepProgress = {
  state: 'not_started' | 'running' | 'confirmed' | 'rejected' | 'uncertain' | 'not_required';
  error: unknown | null;
  availability?: GlobalPublicationSignupReadback;
};

export type GlobalPublicationOccurrenceProgress = AdminGlobalPublicationOccurrence & Record<GlobalPublicationStep, GlobalPublicationStepProgress>;

export interface AdminGlobalPublicationPreview {
  coreId: string;
  valid: boolean;
  status: 'draft_ready' | 'blocked';
  blockers: AdminGlobalPublicationBlocker[];
  policyDraftRevision: number;
  policyDraftImpact: Record<string, unknown> | null;
  impact: {
    affectedCityCount: number;
    publishableOccurrenceCount: number;
    preservedPastDraftOccurrences: number;
    publishableOccurrences: AdminGlobalPublicationOccurrence[];
    preservedPastDraftOccurrenceEntries: AdminGlobalPublicationOccurrence[];
  };
  published: false;
  participantSignupOpened: false;
  appliedToPublic: false;
}

export type AdminGlobalPublicationResult = {
  coreId: string;
  mainEditionId: string;
  public: true;
  participantSignupOpened: false;
} & (
  | { published: true; alreadyPublished: false; editionCount: number; publishedOccurrenceCount: number;
      policyDraftApplied: boolean; globalSignupReleaseEnabled: boolean; publishedOccurrences: AdminGlobalPublicationOccurrence[] }
  | { published: false; alreadyPublished: true }
);
// Exact blocker fields from the EFS-S04 C/3 scoped-publication addendum.
export const GLOBAL_SCOPE_PUBLICATION_BLOCKER_FIELDS = {
  GLOBAL_CALENDAR_REQUIRED: [], STALE_CALENDAR_REVISION: [], PUBLISHED_CORE_REQUIRED: [],
  MAIN_EDITION_NOT_PUBLIC: [], STAFFING_PUBLICATION_IS_SEPARATE: [], PENDING_CORE_DRAFT: [],
  PARTICIPANT_RELEASE_MUST_BE_OFF: [], INVALID_GLOBAL_SLOT_DEMAND: [], EMPTY_PUBLICATION_SCOPE: [],
  FOREIGN_EDITION: ['editionId'], INVALID_EDITION_PUBLIC_METADATA: ['editionId'], SECOND_DEFAULT_EDITION: ['editionId'],
  INACTIVE_CITY_HAS_OTHER_PUBLICATIONS: ['editionId'], EFFECTIVE_CITY_POLICY_MISSING: ['editionId'],
  INCOMPATIBLE_EFFECTIVE_CITY_POLICY: ['editionId'], INVALID_PUBLIC_COVER: ['editionId'], NO_INCLUDED_DATES_FOR_EDITION: ['editionId'],
  FOREIGN_OR_CANCELLED_GLOBAL_DATE: ['editionId', 'globalDateId'], CITY_DATE_PARTICIPATION_MISSING: ['editionId', 'globalDateId'],
  LOCAL_OCCURRENCE_MISSING_OR_DRIFTED: ['editionId', 'globalDateId'],
  PUBLISHED_DATE_BLUEPRINT_MISSING: ['globalDateId'], UNAPPROVED_FUTURE_BLUEPRINT: ['globalDateId'], INVALID_DATED_SLOT_DEMAND: ['globalDateId'],
  OCCURRENCE_STATUS_NOT_PUBLISHABLE: ['occurrenceId'], PROTECTED_OR_EXPIRED_PLANNED_OCCURRENCE: ['occurrenceId'],
  OCCURRENCE_CAPACITY_POLICY_DRIFT: ['occurrenceId'], INVALID_LOCAL_DST_TIME: ['occurrenceId', 'blockPosition'],
  NON_POSITIVE_REAL_BLOCK_DURATION: ['occurrenceId', 'blockPosition'],
} as const;

export type AdminGlobalScopePublicationBlocker = {
  [Code in keyof typeof GLOBAL_SCOPE_PUBLICATION_BLOCKER_FIELDS]: { code: Code } & {
    [Field in (typeof GLOBAL_SCOPE_PUBLICATION_BLOCKER_FIELDS)[Code][number]]: Field extends 'blockPosition' ? number : string;
  }
}[keyof typeof GLOBAL_SCOPE_PUBLICATION_BLOCKER_FIELDS];

export interface EventGlobalScopePublicationCommand {
  coreId: string;
  expectedCalendarRevision: number;
  editionIds: string[];
  globalDateIds: string[];
}

export interface AdminGlobalScopePublicationImpact {
  plannedOccurrenceCount: number;
  alreadyPublishedOccurrenceCount: number;
  legacyCapacityUpgrades: number;
  excludedSelections: number;
  willActivateEditionIds: string[];
}

export interface AdminGlobalScopePublicationPreview {
  valid: boolean;
  status: 'draft_ready' | 'blocked';
  coreId: string;
  calendarRevision: number | null;
  editionIds: string[];
  globalDateIds: string[];
  blockers: AdminGlobalScopePublicationBlocker[];
  impact: AdminGlobalScopePublicationImpact;
  published: false;
  participantSignupOpened: false;
  appliedToPublic: false;
}

export type AdminGlobalScopePublicationResult = {
  coreId: string;
  calendarRevision: number;
  publishedOccurrenceCount: number;
  activatedEditionCount: number;
  legacyCapacityUpgrades: number;
  mainEditionId: string;
  impact: AdminGlobalScopePublicationImpact;
  participantSignupOpened: false;
  globalSignupReleaseEnabled: boolean;
} & ({ published: true; alreadyPublished: false } | { published: false; alreadyPublished: true });

export interface AdminGlobalScopePublicationSnapshot {
  core: IEventCoreDetail;
  calendar: AdminGlobalCalendarResult;
  editions: IAdminEventDetail[];
  policy: AdminEffectivePolicyResult;
}
