import type { AdminEventTimelineOccurrence } from './i-admin-event-timeline';
import type { AdminEventPolicyDraft } from './i-admin-event-policy';
import type { AdminEffectivePolicyResult, AdminGlobalCalendarResult } from './i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail } from './i-event-admin';

type GlobalDate = AdminGlobalCalendarResult['globalDates'][number];

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
  cities: { city: AdminGlobalCalendarResult['cities'][number]; dates: SavedProgramDate[] }[];
}
