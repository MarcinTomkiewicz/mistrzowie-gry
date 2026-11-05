import { EventOccurrenceStatus } from '../../enums/event';
import { mapEventPolicyDocument, samePolicyDocument } from '../../factories/event-policy-form.factory';
import { GLOBAL_PUBLICATION_BLOCKER_CODES, type AdminGlobalPublicationOccurrence, type AdminGlobalPublicationPreview,
  type AdminGlobalPublicationResult } from '../../interfaces/i-admin-global-event-publication';
import type { IAdminEventDetail, IEventCoreDetail } from '../../interfaces/i-event-admin';
import type { AdminEffectivePolicyResult, AdminGlobalCalendarResult } from '../../interfaces/i-admin-global-event';
import type { AdminEventPolicyDraft } from '../../interfaces/i-admin-event-policy';
import type { AdminEventTimeline } from '../../interfaces/i-admin-event-timeline';
import type { EventGlobalSavedSnapshot } from '../../interfaces/i-event-global-saved-summary';
import { isValidIsoDate } from '../../utils/date';
import { assertEdgeContract, readEdgeObject, readEdgeUuid } from '../../utils/edge-contract';

export type FirstGlobalPublicationContext = Pick<AdminGlobalPublicationResult, 'coreId' | 'mainEditionId'> & {
  snapshot: EventGlobalSavedSnapshot;
  readiness: AdminGlobalPublicationPreview;
};

export function assertGlobalPublicationPreview(preview: AdminGlobalPublicationPreview, coreId: string): void {
  const impact = preview.impact;
  assertEdgeContract(preview.coreId === coreId && typeof preview.valid === 'boolean' && Array.isArray(preview.blockers) &&
    preview.status === (preview.valid ? 'draft_ready' : 'blocked') && preview.valid === (preview.blockers.length === 0) &&
    preview.published === false && preview.participantSignupOpened === false && preview.appliedToPublic === false &&
    [preview.policyDraftRevision, impact.affectedCityCount, impact.publishableOccurrenceCount,
      impact.preservedPastDraftOccurrences].every(value => Number.isInteger(value) && value >= 0) &&
    Array.isArray(impact.publishableOccurrences) && Array.isArray(impact.preservedPastDraftOccurrenceEntries) &&
    impact.publishableOccurrences.length === impact.publishableOccurrenceCount &&
    impact.preservedPastDraftOccurrenceEntries.length === impact.preservedPastDraftOccurrences &&
    (!preview.valid || (impact.publishableOccurrenceCount > 0 &&
      new Set(impact.publishableOccurrences.map(row => row.editionId)).size === impact.affectedCityCount)),
  'globalPublication.preview', 'the frozen read-only readiness result for the requested Core');
  indexOccurrences([...impact.publishableOccurrences, ...impact.preservedPastDraftOccurrenceEntries]);
  if (preview.policyDraftImpact !== null) readEdgeObject(preview.policyDraftImpact, 'globalPublication.policyDraftImpact');
  for (const blocker of preview.blockers) {
    assertEdgeContract(GLOBAL_PUBLICATION_BLOCKER_CODES.includes(blocker.code), 'globalPublication.blocker', 'a frozen readiness code');
    if (blocker.editionId !== undefined) readEdgeUuid(blocker.editionId, 'globalPublication.editionId');
    if (blocker.date !== undefined) assertEdgeContract(isValidIsoDate(blocker.date), 'globalPublication.date', 'a real ISO date');
    for (const value of [blocker.blockPosition, blocker.totalSlots]) {
      assertEdgeContract(value === undefined || (Number.isInteger(value) && value >= 0), 'globalPublication.block', 'an optional nonnegative integer');
    }
    for (const value of [blocker.fieldErrors, blocker.policyBlockers]) {
      assertEdgeContract(value === undefined || Array.isArray(value), 'globalPublication.policyIssues', 'an optional array');
    }
  }
}

export function assertGlobalPublicationResult(result: AdminGlobalPublicationResult, context: FirstGlobalPublicationContext): void {
  assertEdgeContract(result.coreId === context.coreId && result.mainEditionId === context.mainEditionId &&
    result.public === true && result.participantSignupOpened === false &&
    ((result.published === true && result.alreadyPublished === false) || (result.published === false && result.alreadyPublished === true)),
  'globalPublication.result', 'an explicit first publication or short idempotent result for the requested Core and main Edition');
  if (result.published) {
    const published = indexOccurrences(result.publishedOccurrences);
    const impact = context.readiness.impact;
    assertEdgeContract(result.editionCount === impact.affectedCityCount &&
      result.publishedOccurrenceCount === impact.publishableOccurrenceCount && published.size === impact.publishableOccurrenceCount &&
      result.policyDraftApplied === (context.readiness.policyDraftRevision > 0) && typeof result.globalSignupReleaseEnabled === 'boolean' &&
      impact.publishableOccurrences.every(entry => {
        const saved = published.get(entry.occurrenceId);
        return saved?.editionId === entry.editionId && saved.date === entry.date;
      }), 'globalPublication.first', 'the exact readiness identities, counts and separate policy/platform flags');
  }
}

export function assertFirstPublishedScope(context: FirstGlobalPublicationContext, core: IEventCoreDetail, calendar: AdminGlobalCalendarResult,
  editions: (IAdminEventDetail | null)[], timelines: AdminEventTimeline[]): void {
  const expected = context.snapshot.calendar;
  const linked = calendar.globalDates.flatMap(day => day.cityOccurrences.map(city => city.occurrenceId).filter(id => id !== null));
  assertEdgeContract(calendar.cities.length === expected.cities.length && core.editions.length === expected.cities.length &&
    editions.length === expected.cities.length && timelines.length === expected.cities.length &&
    new Set(linked).size === linked.length &&
    new Set(calendar.cities.map(city => city.editionId)).size === calendar.cities.length &&
    new Set(core.editions.map(city => city.id)).size === core.editions.length &&
    new Set(calendar.globalDates.map(day => day.globalOccurrenceId)).size === calendar.globalDates.length &&
    new Set(calendar.globalDates.map(day => day.date)).size === calendar.globalDates.length &&
    calendar.globalDates.length === expected.globalDates.length && expected.globalDates.every(day => {
      const saved = calendar.globalDates.find(row => row.globalOccurrenceId === day.globalOccurrenceId && row.date === day.date);
      return saved?.status === day.status && saved.cityOccurrences.length === day.cityOccurrences.length &&
        new Set(saved.cityOccurrences.map(city => city.editionId)).size === saved.cityOccurrences.length && day.cityOccurrences.every(city =>
        saved.cityOccurrences.some(row => row.editionId === city.editionId && row.occurrenceId === city.occurrenceId && row.decision === city.decision));
    }), 'globalPublication.calendarScope', 'the saved date and city participation identities captured with readiness');
  const impact = context.readiness.impact;
  const scope = indexOccurrences([...impact.publishableOccurrences, ...impact.preservedPastDraftOccurrenceEntries]);
  const released = new Set(impact.publishableOccurrences.map(row => row.occurrenceId));
  const seen = new Set<string>();
  for (const [index, city] of expected.cities.entries()) {
    const edition = editions[index];
    const timeline = timelines[index];
    assertEdgeContract(edition !== null && edition !== undefined && edition.id === city.editionId && edition.eventCoreId === core.id &&
      edition.slug === city.slug && edition.city === city.city && edition.timezone === city.timezone &&
      edition.isActive && edition.currentlyPublic && edition.isDefaultPublic === city.isMain &&
      timeline !== undefined && timeline.eventId === city.editionId && timeline.eventCoreId === core.id && timeline.timezone === city.timezone &&
      timeline.occurrences.length === edition.occurrences.length &&
      new Set(edition.occurrences.map(row => row.date)).size === edition.occurrences.length &&
      core.editions.some(row => row.id === city.editionId && row.isActive && row.isDefaultPublic === city.isMain) &&
      calendar.cities.some(row => row.editionId === city.editionId && row.city === city.city && row.slug === city.slug &&
        row.timezone === city.timezone && row.isActive && row.isMain === city.isMain),
    'globalPublication.city', 'each expected city independently read as a public Edition');
    for (const occurrence of edition.occurrences) {
      const entry = scope.get(occurrence.id);
      const published = released.has(occurrence.id);
      const status = published ? EventOccurrenceStatus.Published : EventOccurrenceStatus.Planned;
      const day = calendar.globalDates.find(row => row.date === occurrence.date);
      const local = day?.cityOccurrences.find(row => row.editionId === edition.id && row.occurrenceId === occurrence.id);
      const operational = timeline.occurrences.find(row => row.occurrenceId === occurrence.id && row.date === occurrence.date);
      assertEdgeContract(!seen.has(occurrence.id) &&
        (entry === undefined || (entry.editionId === edition.id && entry.date === occurrence.date && local !== undefined)) &&
        occurrence.status === status && operational?.status === status && operational.participantSignupOpenedAt === null &&
        (local === undefined || (local.occurrenceStatus === status && local.publishedAt === occurrence.publishedAt)) &&
        (published ? occurrence.publishedAt !== null && Number.isFinite(Date.parse(occurrence.publishedAt)) &&
          day?.status === 'scheduled' && local?.decision === 'included' : occurrence.publishedAt === null),
      'globalPublication.occurrence', 'the same server-selected identity in Calendar, Edition and Timeline, with its exact status and no participant signup history');
      seen.add(occurrence.id);
    }
  }
  assertEdgeContract([...scope.keys()].every(id => seen.has(id)),
    'globalPublication.scopeReadback', 'every publishable and preserved identity returned by readiness');
}

function indexOccurrences(entries: AdminGlobalPublicationOccurrence[]): Map<string, AdminGlobalPublicationOccurrence> {
  assertEdgeContract(Array.isArray(entries), 'globalPublication.identities', 'the server-supplied identity array');
  for (const entry of entries) {
    readEdgeObject(entry, 'globalPublication.identity');
    readEdgeUuid(entry.editionId, 'globalPublication.editionId');
    readEdgeUuid(entry.occurrenceId, 'globalPublication.occurrenceId');
    assertEdgeContract(isValidIsoDate(entry.date), 'globalPublication.date', 'a real ISO date');
  }
  const index = new Map(entries.map(entry => [entry.occurrenceId, entry]));
  assertEdgeContract(index.size === entries.length && new Set(entries.map(entry => `${entry.editionId}:${entry.date}`)).size === entries.length,
    'globalPublication.identities', 'unique occurrence IDs and Edition/date pairs across the whole scope');
  return index;
}

export function assertFirstAppliedPolicy(context: FirstGlobalPublicationContext, draft: AdminEventPolicyDraft,
  policy: AdminEffectivePolicyResult | null, result: AdminGlobalPublicationResult | null): void {
  assertEdgeContract(draft.coreId === context.coreId && !draft.hasDraft && policy !== null &&
    policy.coreId === context.coreId && policy.mainEditionId === context.mainEditionId &&
    draft.canonicalBaseline.coreId === context.coreId && draft.canonicalBaseline.mainEditionId === context.mainEditionId &&
    (!result?.published || result.policyDraftApplied === (context.readiness.policyDraftRevision > 0)),
  'globalPublication.policyApplication', 'the consumed expected policy draft and consistent first-publication application flag');
  const expected = mapEventPolicyDocument(context.snapshot.policyDraft);
  assertEdgeContract(samePolicyDocument(expected, mapEventPolicyDocument(draft)) &&
    samePolicyDocument(expected, mapEventPolicyDocument({ ...draft, canonicalBaseline: policy })),
  'globalPublication.effectivePolicy', 'all expected global values and city overrides applied in the canonical effective policy');
}

