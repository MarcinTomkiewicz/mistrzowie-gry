import type { AdminEventTimeline, AdminEventTimelineOccurrence } from './i-admin-event-timeline';
import type { AdminEventPolicyDraft } from './i-admin-event-policy';
import type { AdminEffectivePolicyResult, AdminGlobalCalendarResult } from './i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail } from './i-event-admin';

type GlobalDate = AdminGlobalCalendarResult['globalDates'][number];

export type GlobalSaveCheckReason = 'coverPending' | 'coverDirty' | 'program' | 'publication' | 'city' | 'diagnostics' |
  'busy' | 'pending' | 'unchanged' | 'invalid' | 'section' | 'changed' | 'otherOperation';

export type EventGlobalSaveFailure = 'unavailable' | 'empty' | 'previewRejected' | 'writeRejected' | 'unconfirmed';
export type EventGlobalSaveGuard = 'notLoaded' | 'busy' | 'pending' | 'conflict' | 'blocked' | 'protected' |
  'invalid' | 'unchanged' | 'previewRequired' | 'previewMismatch' | 'draftRequired' | 'draftPending';
export type EventGlobalSavePhase = 'check' | 'prepare' | 'preview' | 'save' | 'apply' | 'readback';

export interface EventGlobalDiagnosticIssue {
  field: string | null;
  location: string | null;
  message: string;
  code: string | null;
  technical: string | null;
}

export interface EventGlobalDiagnosticGroup {
  key: string;
  title: string;
  phase: string;
  step: number;
  issues: EventGlobalDiagnosticIssue[];
  technical: { label: string; value: string }[];
}

export interface SavedProgramDate {
  key: string;
  date: string;
  globalStatus: GlobalDate['status'] | null;
  participation: GlobalDate['cityOccurrences'][number]['decision'] | 'unlinked' | 'missing';
  occurrenceStatus: AdminEventTimelineOccurrence['status'] | null;
  counts: { pending: number; confirmed: number } | null;
}

export interface EventGlobalSavedSnapshot {
  core: IEventCoreDetail;
  calendar: AdminGlobalCalendarResult;
  policy: AdminEffectivePolicyResult;
  policyDraft: AdminEventPolicyDraft;
  edition: IAdminEventDetail;
  cities: { city: AdminGlobalCalendarResult['cities'][number]; dates: SavedProgramDate[]; timeline: AdminEventTimeline }[];
}
