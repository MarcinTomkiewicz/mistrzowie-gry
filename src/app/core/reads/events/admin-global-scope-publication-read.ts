import { forkJoin, map, of, switchMap } from 'rxjs';

import { EventOccurrenceStatus, ParticipantSignupKind } from '../../enums/event';
import type {
  AdminGlobalPublicationOccurrence, AdminGlobalScopePublicationPreview, AdminGlobalScopePublicationResult, AdminGlobalScopePublicationSnapshot,
  EventGlobalScopePublicationCommand,
} from '../../interfaces/i-admin-global-event-publication';
import type { AdminGlobalCalendarResult } from '../../interfaces/i-admin-global-event';
import type { IAdminOccurrenceListItem } from '../../interfaces/i-event-admin';
import type { EventAdmin } from '../../services/event-admin/event-admin';
import type { EventRead } from './event-read';
import { assertFirstAppliedPolicy, assertFirstPublishedScope, type FirstGlobalPublicationContext } from './admin-global-publication.contract';
import type { AdminGlobalPublicationResult } from '../../interfaces/i-admin-global-event-publication';
import { isValidIsoDate } from '../../utils/date';
import { assertEdgeContract, readEdgeUuid } from '../../utils/edge-contract';
import { sameGlobalScopePublicationImpact } from './admin-global-scope-publication.contract';

export interface GlobalScopePublicationContext {
  kind: 'scope';
  command: EventGlobalScopePublicationCommand;
  readiness: AdminGlobalScopePublicationPreview;
  snapshot: AdminGlobalScopePublicationSnapshot;
}

const preservedOccurrenceFields = ['status', 'publishedAt', 'participantSignupOpenedAt', 'participantSignupKind',
  'participantSignupOpensAt', 'participantSignupClosesAt', 'hostSignupOpensAt', 'hostSignupClosesAt',
  'capacityPolicy', 'sessionCapacityCeiling', 'wholeEventCapacity', 'slotCapacity', 'participantCapacity',
  'programItemCount', 'activeParticipantCount'] as const satisfies readonly (keyof IAdminOccurrenceListItem)[];

export function assertScopeCalendar(calendar: AdminGlobalCalendarResult, coreId: string): void {
  assertEdgeContract(calendar.coreId === coreId && calendar.calendarLifecycle === 'global' &&
    Number.isInteger(calendar.calendarRevision) && calendar.calendarRevision > 0 &&
    new Set(calendar.cities.map(city => city.editionId)).size === calendar.cities.length &&
    calendar.cities.filter(city => city.isMain).length === 1 &&
    calendar.cities.some(city => city.isMain && city.editionId === calendar.mainEditionId) &&
    new Set(calendar.globalDates.map(day => day.globalOccurrenceId)).size === calendar.globalDates.length &&
    new Set(calendar.globalDates.map(day => day.date)).size === calendar.globalDates.length,
  'scopePublication.calendar', 'the current canonical Global calendar, integer lock revision and unique identities');
  readEdgeUuid(calendar.mainEditionId, 'scopePublication.mainEditionId');
  for (const city of calendar.cities) readEdgeUuid(city.editionId, 'scopePublication.editionId');
  const linked = new Set<string>();
  for (const day of calendar.globalDates) {
    readEdgeUuid(day.globalOccurrenceId, 'scopePublication.globalDateId');
    assertEdgeContract(isValidIsoDate(day.date) && ['scheduled', 'cancelled'].includes(day.status) &&
      new Set(day.cityOccurrences.map(city => city.editionId)).size === day.cityOccurrences.length,
    'scopePublication.date', 'a unique shared date and one participation entry per city');
    for (const local of day.cityOccurrences) {
      assertEdgeContract(calendar.cities.some(city => city.editionId === local.editionId) &&
        ['included', 'excluded', 'unspecified'].includes(local.decision) &&
        (local.occurrenceStatus === null || Object.values(EventOccurrenceStatus).some(status => status === local.occurrenceStatus)) &&
        (local.publishedAt === null || validTimestamp(local.publishedAt)),
      'scopePublication.participation', 'an actual Core city participation with canonical status and timestamp');
      if (local.occurrenceId !== null) {
        readEdgeUuid(local.occurrenceId, 'scopePublication.occurrenceId');
        assertEdgeContract(!linked.has(local.occurrenceId), 'scopePublication.occurrenceId', 'a unique linked local occurrence');
        linked.add(local.occurrenceId);
      }
    }
  }
}

export function readGlobalScopePublicationSnapshot(admin: EventAdmin,
  command: Pick<EventGlobalScopePublicationCommand, 'coreId' | 'editionIds'>, calendar?: AdminGlobalCalendarResult) {
  return forkJoin({ core: admin.getCoreDetail(command.coreId), calendar: calendar ? of(calendar) : admin.getGlobalCalendar(command.coreId),
    policy: admin.getEffectivePolicy(command.coreId), editions: forkJoin(command.editionIds.map(id => admin.getEditionDetail(id))),
  }).pipe(map(({ core, calendar, policy, editions }): AdminGlobalScopePublicationSnapshot => {
    assertScopeCalendar(calendar, command.coreId);
    assertEdgeContract(core !== null && core.id === command.coreId && calendar.coreKey === core.key &&
      core.isActive && core.hasPublicPage && new Set(core.editions.map(city => city.id)).size === core.editions.length &&
      core.editions.length === calendar.cities.length && calendar.cities.every(city => core.editions.some(edition =>
        edition.id === city.editionId && edition.slug === city.slug && edition.city === city.city &&
        edition.isActive === city.isActive && edition.isDefaultPublic === city.isDefaultPublicLegacy)) &&
      core.editions.some(city => city.id === calendar.mainEditionId && city.isActive && city.isDefaultPublic) &&
      core.editions.filter(city => city.isActive && city.isDefaultPublic).length === 1 &&
      policy.coreId === core.id && policy.coreKey === core.key && policy.lifecycle === 'global' && policy.mainEditionId === calendar.mainEditionId &&
      new Set(policy.editions.map(city => city.editionId)).size === policy.editions.length &&
      policy.editions.length === calendar.cities.length && calendar.cities.every(city => policy.editions.some(row =>
        row.editionId === city.editionId && row.city === city.city && row.slug === city.slug && row.isMain === city.isMain)),
    'scopePublication.snapshot', 'the public Core, default Edition and canonical effective policy');
    const saved = editions.map((edition, index) => {
      const city = calendar.cities.find(row => row.editionId === command.editionIds[index]);
      assertEdgeContract(edition !== null && city !== undefined && edition.id === city.editionId && edition.eventCoreId === core.id &&
        edition.slug === city.slug && edition.city === city.city && edition.timezone === city.timezone &&
        edition.isActive === city.isActive && edition.isDefaultPublic === city.isDefaultPublicLegacy &&
        new Set(edition.occurrences.map(row => row.id)).size === edition.occurrences.length &&
        new Set(edition.occurrences.map(row => row.date)).size === edition.occurrences.length &&
        policy.editions.some(row => row.editionId === edition.id),
      'scopePublication.edition', 'each requested Edition and its unique canonical occurrences');
      for (const occurrence of edition.occurrences) {
        readEdgeUuid(occurrence.id, 'scopePublication.occurrenceId');
        assertEdgeContract(isValidIsoDate(occurrence.date) && Object.values(EventOccurrenceStatus).includes(occurrence.status) &&
          Object.values(ParticipantSignupKind).includes(occurrence.participantSignupKind) &&
          ['legacy_shared', 'independent'].includes(occurrence.capacityPolicy) &&
          [occurrence.sessionCapacityCeiling, occurrence.wholeEventCapacity].every(value =>
            value === null || Number.isInteger(value) && value >= 0) &&
          [occurrence.publishedAt, occurrence.participantSignupOpenedAt, occurrence.participantSignupOpensAt,
            occurrence.participantSignupClosesAt, occurrence.hostSignupOpensAt, occurrence.hostSignupClosesAt]
            .every(value => value === null || validTimestamp(value)),
        'scopePublication.occurrence', 'a canonical dated occurrence, capacity policy and nullable publication/signup timestamps');
      }
      const effective = policy.editions.find(row => row.editionId === edition.id)?.effective;
      assertEdgeContract(effective !== undefined && Object.values(ParticipantSignupKind).includes(effective.participantSignupKind) &&
        [effective.sessionCapacityCeiling, effective.wholeEventCapacity].every(value => value === null || Number.isInteger(value) && value >= 0),
      'scopePublication.effectivePolicy', 'the canonical effective signup kind and nullable capacity limits');
      return edition;
    });
    assertEdgeContract(new Set(saved.flatMap(edition => edition.occurrences.map(row => row.id))).size ===
      saved.reduce((count, edition) => count + edition.occurrences.length, 0),
    'scopePublication.occurrences', 'unique local occurrence identities across selected Editions');
    return { core, calendar, policy, editions: saved };
  }));
}

export function readFirstGlobalPublicationSnapshot(admin: EventAdmin, publicRead: EventRead,
  context: FirstGlobalPublicationContext, result: AdminGlobalPublicationResult | null) {
  return readGlobalScopePublicationSnapshot(admin, {
    coreId: context.coreId, editionIds: context.snapshot.calendar.cities.map(city => city.editionId),
  }).pipe(switchMap(snapshot => forkJoin({
    timelines: forkJoin(snapshot.editions.map(edition => admin.getTimeline(edition.id))),
    policyDraft: admin.getPolicyDraft(context.coreId), page: publicRead.getPublicPage(snapshot.core.key),
  }).pipe(map(({ timelines, policyDraft, page }) => {
    assertFirstPublishedScope(context, snapshot.core, snapshot.calendar, snapshot.editions, timelines);
    assertFirstAppliedPolicy(context, policyDraft, snapshot.policy, result);
    assertEdgeContract(snapshot.core.key === context.snapshot.core.key && page !== null && page.core.id === snapshot.core.id &&
      page.core.key === snapshot.core.key && page.defaultEventId === context.mainEditionId &&
      page.editions.length === context.readiness.impact.affectedCityCount && snapshot.editions.every(edition =>
        page.editions.some(row => row.id === edition.id && row.slug === edition.slug)),
    'globalPublication.publicRead', 'independent public visibility of the Core, default Edition and all published cities');
    return snapshot;
  }))));
}

export function assertScopeReadinessSnapshot(context: GlobalScopePublicationContext): void {
  const { command, readiness, snapshot } = context;
  const { calendar } = snapshot;
  let planned = 0, published = 0, excluded = 0, upgrades = 0;
  const activate: string[] = [];
  assertEdgeContract(calendar.calendarRevision === command.expectedCalendarRevision && readiness.valid &&
    readiness.calendarRevision === command.expectedCalendarRevision, 'scopePublication.prepared', 'the same current calendar revision and valid readiness');
  for (const edition of snapshot.editions) {
    let included = 0;
    for (const id of command.globalDateIds) {
      const day = calendar.globalDates.find(row => row.globalOccurrenceId === id);
      const local = day?.cityOccurrences.find(row => row.editionId === edition.id);
      assertEdgeContract(day?.status === 'scheduled' && local !== undefined && local.decision !== 'unspecified',
        'scopePublication.selection', 'every selected shared date and its actual city participation');
      if (local.decision === 'excluded') { excluded++; continue; }
      included++;
      const occurrence = edition.occurrences.find(row => row.id === local.occurrenceId && row.date === day.date);
      assertEdgeContract(occurrence !== undefined && !local.unlinkedSameDate && local.occurrenceStatus === occurrence.status &&
        local.publishedAt === occurrence.publishedAt, 'scopePublication.link', 'the exact linked local ID, date, status and publication timestamp');
      if (occurrence.status === EventOccurrenceStatus.Planned) {
        assertEdgeContract(occurrence.publishedAt === null && occurrence.participantSignupOpenedAt === null,
          'scopePublication.planned', 'a private planned occurrence without prior publication or participant opening');
        planned++;
        if (occurrence.capacityPolicy === 'legacy_shared' && occurrence.sessionCapacityCeiling === null && occurrence.wholeEventCapacity === null) upgrades++;
      } else {
        assertEdgeContract([EventOccurrenceStatus.Published, EventOccurrenceStatus.ParticipantSignupClosed].includes(occurrence.status) &&
          validTimestamp(occurrence.publishedAt), 'scopePublication.existing', 'an already-published replay-eligible occurrence');
        published++;
      }
    }
    if (!edition.isActive && included > 0) activate.push(edition.id);
  }
  assertEdgeContract(sameGlobalScopePublicationImpact(readiness.impact, { plannedOccurrenceCount: planned,
    alreadyPublishedOccurrenceCount: published, excludedSelections: excluded, legacyCapacityUpgrades: upgrades,
    willActivateEditionIds: activate }), 'scopePublication.preparedImpact', 'the full readiness impact reconciled with the saved Cartesian selection');
}

export function assertScopedPublicationReadback(context: GlobalScopePublicationContext, current: AdminGlobalScopePublicationSnapshot,
  result: AdminGlobalScopePublicationResult | null): AdminGlobalPublicationOccurrence[] {
  const before = context.snapshot;
  const selectedDays = new Set(context.command.globalDateIds);
  const selectedEditions = new Set(context.command.editionIds);
  const activate = new Set(context.readiness.impact.willActivateEditionIds);
  assertEdgeContract(current.core.id === before.core.id && current.core.key === before.core.key &&
    current.calendar.mainEditionId === before.calendar.mainEditionId &&
    current.calendar.calendarRevision === context.command.expectedCalendarRevision &&
    JSON.stringify(current.calendar.schedule) === JSON.stringify(before.calendar.schedule) &&
    JSON.stringify(current.calendar.timeBlocks) === JSON.stringify(before.calendar.timeBlocks) &&
    current.calendar.globalDates.length === before.calendar.globalDates.length &&
    current.calendar.cities.length === before.calendar.cities.length,
  'scopePublication.readback', 'the same public Core, calendar revision, schedule and identity scope');
  for (const city of before.calendar.cities) {
    const saved = current.calendar.cities.find(row => row.editionId === city.editionId);
    assertEdgeContract(saved !== undefined && saved.city === city.city && saved.slug === city.slug && saved.timezone === city.timezone &&
      saved.isMain === city.isMain && saved.isActive === (city.isActive || activate.has(city.editionId)),
    'scopePublication.activation', 'exactly the Editions selected for activation and unchanged remaining city identities');
  }
  for (const edition of before.core.editions) {
    const saved = current.core.editions.find(row => row.id === edition.id);
    assertEdgeContract(saved !== undefined && saved.isDefaultPublic === edition.isDefaultPublic &&
      saved.occurrenceCount === edition.occurrenceCount && saved.programItemCount === edition.programItemCount,
    'scopePublication.coreEditions', 'unchanged default flags and occurrence/programme counts for every Core Edition');
  }
  const newlyPublished = new Map<string, AdminGlobalPublicationOccurrence>();
  const selectedPublished = new Set<string>();
  for (const day of before.calendar.globalDates) {
    const saved = current.calendar.globalDates.find(row => row.globalOccurrenceId === day.globalOccurrenceId);
    assertEdgeContract(saved !== undefined && saved.date === day.date && saved.status === day.status &&
      saved.cityOccurrences.length === day.cityOccurrences.length, 'scopePublication.dateReadback', 'unchanged shared date identity and participation scope');
    for (const local of day.cityOccurrences) {
      const actual = saved.cityOccurrences.find(row => row.editionId === local.editionId);
      const selected = selectedDays.has(day.globalOccurrenceId) && selectedEditions.has(local.editionId) && local.decision === 'included';
      const released = selected && local.occurrenceStatus === EventOccurrenceStatus.Planned;
      assertEdgeContract(actual !== undefined && actual.occurrenceId === local.occurrenceId && actual.decision === local.decision &&
        actual.unlinkedSameDate === local.unlinkedSameDate && (selected
          ? actual.occurrenceId !== null && isPublishedStatus(actual.occurrenceStatus) && validTimestamp(actual.publishedAt) &&
            (released || actual.publishedAt === local.publishedAt && actual.protected === local.protected)
          : actual.occurrenceStatus === local.occurrenceStatus && actual.publishedAt === local.publishedAt && actual.protected === local.protected),
      'scopePublication.pairReadback', 'the exact persisted selected releases and unchanged excluded or unselected city/date combinations');
      if (selected && actual.occurrenceId) selectedPublished.add(actual.occurrenceId);
      if (released && actual.occurrenceId) newlyPublished.set(actual.occurrenceId, {
        occurrenceId: actual.occurrenceId, editionId: actual.editionId, date: saved.date,
      });
    }
  }
  for (const edition of before.editions) {
    const saved = current.editions.find(row => row.id === edition.id);
    const policy = current.policy.editions.find(row => row.editionId === edition.id)?.effective;
    const oldPolicy = before.policy.editions.find(row => row.editionId === edition.id)?.effective;
    assertEdgeContract(saved !== undefined && saved.occurrences.length === edition.occurrences.length && policy !== undefined && oldPolicy !== undefined &&
      policy.participantSignupKind === oldPolicy.participantSignupKind && policy.sessionCapacityCeiling === oldPolicy.sessionCapacityCeiling &&
      policy.wholeEventCapacity === oldPolicy.wholeEventCapacity,
    'scopePublication.editionReadback', 'the same local occurrence set and effective publication policy');
    for (const occurrence of edition.occurrences) {
      const actual = saved.occurrences.find(row => row.id === occurrence.id && row.date === occurrence.date);
      assertEdgeContract(actual !== undefined, 'scopePublication.occurrenceReadback', 'the exact saved local occurrence identity and date');
      const selected = selectedPublished.has(occurrence.id);
      if (selected) {
        const local = current.calendar.globalDates.find(day => day.date === occurrence.date)?.cityOccurrences.find(city => city.editionId === edition.id);
        assertPublishedMarkers(actual, occurrence);
        assertEdgeContract(actual.status === local?.occurrenceStatus && actual.publishedAt === local.publishedAt,
          'scopePublication.publicationMarkers', 'the same persisted status and publication timestamp in Calendar and Edition');
      }
      if (newlyPublished.has(occurrence.id)) {
        assertEdgeContract(actual.participantSignupOpensAt === occurrence.participantSignupOpensAt &&
          actual.participantSignupClosesAt === occurrence.participantSignupClosesAt &&
          actual.hostSignupOpensAt === null && actual.hostSignupClosesAt === null && actual.capacityPolicy === 'independent' &&
          actual.participantSignupKind === policy.participantSignupKind && actual.sessionCapacityCeiling === policy.sessionCapacityCeiling &&
          actual.wholeEventCapacity === policy.wholeEventCapacity && actual.activeParticipantCount === occurrence.activeParticipantCount &&
          actual.programItemCount === occurrence.programItemCount,
        'scopePublication.newRelease', 'persisted publication with unchanged participant windows/counts, cleared host windows and effective capacity');
      } else assertEdgeContract(preservedOccurrenceFields.every(field =>
        (selected && (field === 'status' || field === 'participantSignupOpenedAt')) || actual[field] === occurrence[field]),
      'scopePublication.preservedOccurrence', 'preserved occurrence data and participants; selected signup transitions require consistent publication markers');
    }
  }
  for (const day of before.calendar.datedTimeBlocks) {
    const saved = current.calendar.datedTimeBlocks.find(row => row.globalOccurrenceId === day.globalOccurrenceId && row.date === day.date);
    assertEdgeContract(saved !== undefined && saved.cities.length === day.cities.length &&
      day.cities.every(city => saved.cities.some(row => row.editionId === city.editionId &&
        row.isOverride === city.isOverride && (!city.publishedSnapshot || row.publishedSnapshot) &&
        JSON.stringify(row.timeBlocks) === JSON.stringify(city.timeBlocks))),
    'scopePublication.publishedBlocks', 'unchanged effective city/date blocks and preservation of existing published snapshots');
  }
  // Canonical persistence proves the completed release. Current readiness only qualifies a NEW writer/replay.
  const impact = context.readiness.impact;
  const replayImpact = { ...impact, plannedOccurrenceCount: 0, legacyCapacityUpgrades: 0, willActivateEditionIds: [],
    alreadyPublishedOccurrenceCount: impact.plannedOccurrenceCount + impact.alreadyPublishedOccurrenceCount };
  assertEdgeContract(newlyPublished.size === impact.plannedOccurrenceCount && selectedPublished.size === replayImpact.alreadyPublishedOccurrenceCount &&
    (result === null || result.mainEditionId === before.calendar.mainEditionId &&
      (result.alreadyPublished ? sameGlobalScopePublicationImpact(result.impact, replayImpact)
        : sameGlobalScopePublicationImpact(result.impact, impact))),
  'scopePublication.reconciled', 'the exact persisted released scope, Edition activations and full original writer/replay reply');
  return [...newlyPublished.values()];
}

export function assertPublishedMarkers(actual: IAdminOccurrenceListItem, before: IAdminOccurrenceListItem = actual): void {
  const openedAt = actual.participantSignupOpenedAt;
  const laterOpening = before.participantSignupOpenedAt === null && validTimestamp(openedAt) &&
    actual.publishedAt !== null && openedAt !== null && Date.parse(openedAt) > Date.parse(actual.publishedAt) &&
    actual.status !== EventOccurrenceStatus.Published;
  assertEdgeContract(isPublishedStatus(actual.status) && validTimestamp(actual.publishedAt) &&
    (before.publishedAt === null || actual.publishedAt === before.publishedAt) &&
    (openedAt === before.participantSignupOpenedAt || laterOpening) &&
    (actual.status !== EventOccurrenceStatus.ParticipantSignupOpen || validTimestamp(openedAt)),
  'scopePublication.persistedMarkers', 'a persisted release with unchanged publishedAt and a consistent subsequent signup opening marker');
}

function isPublishedStatus(status: string | null): boolean {
  return status === EventOccurrenceStatus.Published || status === EventOccurrenceStatus.ParticipantSignupOpen ||
    status === EventOccurrenceStatus.ParticipantSignupClosed;
}

function validTimestamp(value: string | null): boolean {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
