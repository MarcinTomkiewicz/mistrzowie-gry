import type { GlobalTimeBlockInput } from './i-admin-global-event';

export type AdminGlobalEventPageFieldError =
  | { field: 'coreDraft'; code: 'INVALID_CORE_METADATA' }
  | { field: 'editionDrafts'; editionId: string; code: 'INVALID_EDITION_METADATA' }
  | { field: 'selectedDate'; code: 'INVALID_SELECTED_DATE' }
  | { field: 'calendarDraft'; code: 'INVALID_PREVIEW_CALENDAR'; detail: string }
  | { field: 'policy'; code: 'INVALID_POLICY_DRAFT'; detail: string }
  | { field: 'cityOverrides'; editionId: string; code: 'INCOMPATIBLE_SIGNUP_CAPACITY' };

export type AdminGlobalEventPageBlocker =
  | { code: 'STALE_SAVED_POLICY_DRAFT' | 'PUBLISHED_POLICY_WRITE_NOT_RELEASED' |
      'STALE_SAVED_CALENDAR_DRAFT' | 'GLOBAL_CALENDAR_WRITE_NOT_RELEASED' |
      'NO_UPCOMING_DATE_FOR_SELECTED_CITY' }
  | { code: 'EDITION_EFFECTIVE_POLICY_MISSING' | 'PROTECTED_PARTICIPANT_POLICY'; editionId: string };

interface AdminGlobalEventPreviewPage {
  core: {
    id: string;
    key: string;
    name: string | null;
    shortDescription: string | null;
    longDescription: string | null;
    coverImagePath: string | null;
  };
  defaultEventId: string;
  editions: {
    id: string;
    slug: string;
    city: string;
    isMain: boolean;
    venueName: string | null;
    venueAddress: string | null;
    facebookLink: string | null;
    timezone: string;
    startTime: string | null;
    endTime: string | null;
    endDayOffset: number | null;
    priceAmount: number | null;
    priceCurrency: string | null;
    priceBasis: string | null;
    coverImagePath: string | null;
    isForBeginners: boolean | null;
    participantSignupKind: string | null;
    signupRequired: boolean | null;
    sessionCapacityCeiling: number | null;
    wholeEventCapacity: number | null;
    isPublicNow: boolean;
  }[];
  globalDates: {
    date: string;
    globalOccurrenceId: string | null;
    timeBlocks: GlobalTimeBlockInput[] | null;
    cities: {
      editionId: string;
      occurrenceId: string | null;
      includedInPreview: boolean;
      isPublicNow: boolean;
      timeBlocks: GlobalTimeBlockInput[] | null;
    }[];
  }[];
  timeBlocks: GlobalTimeBlockInput[];
  selectedEditionId: string;
  selectedDate: string | null;
  selectedOccurrenceId: string | null;
  program: unknown[];
}

interface AdminGlobalEventPreviewBase {
  preview: true;
  coreId: string;
  blockers: AdminGlobalEventPageBlocker[];
  appliedToPublic: false;
}

// Frozen EFS-058: page:null omits the provenance and public-state keys entirely.
export type AdminGlobalEventPagePreview = AdminGlobalEventPreviewBase & (
  | {
      valid: boolean;
      status: 'invalid' | 'blocked' | 'preview_ready';
      calendarLifecycle: string;
      sources: {
        core: 'canonical' | 'unsaved';
        editions: 'canonical' | 'unsaved';
        policy: 'canonical' | 'saved_draft' | 'unsaved';
        calendar: 'canonical' | 'saved_draft' | 'unsaved';
      };
      fieldErrors: AdminGlobalEventPageFieldError[];
      page: AdminGlobalEventPreviewPage;
      currentlyPublic: boolean;
      participantSignupOpened: false;
    }
  | {
      valid: false;
      status: 'invalid';
      fieldErrors: [Extract<AdminGlobalEventPageFieldError, { code: 'INVALID_PREVIEW_CALENDAR' }>];
      page: null;
    }
);
