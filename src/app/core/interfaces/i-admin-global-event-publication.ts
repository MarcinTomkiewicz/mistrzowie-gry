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
