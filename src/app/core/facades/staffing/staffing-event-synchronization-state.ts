import { EventOccurrenceStatus, EventProgramItemStatus } from '../../enums/event';
import type { AdminStaffingFinalPlan } from '../../interfaces/admin-staffing-final-plan';
import type { AdminStaffingRealizationCore, AdminStaffingSchedule, SyncAdminStaffingPrivateEventResult } from '../../interfaces/admin-staffing-realization';
import type { AdminEventTimeline, TimelineRow } from '../../interfaces/i-admin-event-timeline';
import type { EventProgramReconciliationResult, IAdminEventDetail, IEventCoreDetail } from '../../interfaces/i-event-admin';
import { isValidIsoDate } from '../../utils/date';
import { assertEdgeContract, readEdgeInteger, readEdgeObject, readEdgeUuid } from '../../utils/edge-contract';
import { formatTimeLabel } from '../../utils/time-format';

export type StaffingEventSyncTrigger = 'schedule' | 'finalPlan';
export interface StaffingEventSyncContext {
  realization: AdminStaffingRealizationCore;
  schedule: AdminStaffingSchedule;
  plan: AdminStaffingFinalPlan;
  edition: IAdminEventDetail;
  kind: 'private' | 'released';
}
export type StaffingEventSyncConfirmation =
  | { kind: 'private'; result: SyncAdminStaffingPrivateEventResult }
  | { kind: 'released'; result: EventProgramReconciliationResult };
export interface StaffingEventSyncSnapshot {
  core: IEventCoreDetail;
  edition: IAdminEventDetail;
  timeline: AdminEventTimeline;
}
export interface StaffingEventSyncState {
  phase: 'checking' | 'writing' | 'reading' | 'verified' | 'failed' | 'uncertain' | 'readback' | 'skipped';
  abandoned: boolean;
  trigger: StaffingEventSyncTrigger;
  context: StaffingEventSyncContext | null;
  confirmation: StaffingEventSyncConfirmation | null;
  snapshot: StaffingEventSyncSnapshot | null;
  error: unknown;
}

export class StaffingEventSyncSourceChanged extends Error {
  constructor() {
    super('The saved Staffing schedule or final plan changed during Event synchronization.');
    this.name = 'StaffingEventSyncSourceChanged';
  }
}

export function assertStaffingEventSourceUnchanged(schedule: AdminStaffingSchedule, plan: AdminStaffingFinalPlan,
  context: StaffingEventSyncContext): void {
  if (schedule.realizationId !== context.realization.id || plan.realizationId !== context.realization.id ||
    JSON.stringify(schedule) !== JSON.stringify(context.schedule) || JSON.stringify(plan) !== JSON.stringify(context.plan)) {
    throw new StaffingEventSyncSourceChanged();
  }
}

export function assertPrivateStaffingSyncResult(result: SyncAdminStaffingPrivateEventResult, context: StaffingEventSyncContext): void {
  readEdgeObject(result, 'staffingSync');
  assertEdgeContract(Object.keys(result).sort().join() === ['synchronized', 'changed', 'realizationId', 'eventCoreId',
    'eventId', 'public', 'occurrences', 'slotCount', 'programItemCount'].sort().join(), 'staffingSync', 'the frozen EFS-087 result keys');
  for (const id of [result.realizationId, result.eventCoreId, result.eventId]) readEdgeUuid(id, 'staffingSync.identity');
  readEdgeInteger(result.slotCount, 'staffingSync.slotCount');
  readEdgeInteger(result.programItemCount, 'staffingSync.programItemCount');
  assertEdgeContract(result.synchronized === true && typeof result.changed === 'boolean' && result.public === false &&
    result.realizationId === context.realization.id && result.eventId === context.edition.id &&
    result.eventCoreId === context.edition.eventCoreId && Array.isArray(result.occurrences) &&
    result.slotCount === context.schedule.days.reduce((sum, day) => sum + day.slots.length, 0) &&
    result.programItemCount === context.plan.days.reduce((sum, day) => sum + day.slots.reduce((count, slot) => count + slot.assignments.length, 0), 0),
  'staffingSync', 'the same private Core/Edition and the saved Staffing counts');
  const dates = new Set<string>();
  const ids = new Set<string>();
  for (const occurrence of result.occurrences) {
    readEdgeObject(occurrence, 'staffingSync.occurrence');
    readEdgeUuid(occurrence.occurrenceId, 'staffingSync.occurrenceId');
    assertEdgeContract(isValidIsoDate(occurrence.date) && !dates.has(occurrence.date) && !ids.has(occurrence.occurrenceId),
      'staffingSync.occurrences', 'unique real dates and occurrence identities');
    dates.add(occurrence.date); ids.add(occurrence.occurrenceId);
  }
  assertEdgeContract(dates.size === context.schedule.days.length && context.schedule.days.every(day => dates.has(day.date)),
    'staffingSync.occurrences', 'exactly the saved Staffing dates');
}

export function assertReleasedStaffingSyncResult(result: EventProgramReconciliationResult, context: StaffingEventSyncContext): void {
  readEdgeObject(result, 'staffingReconciliation');
  assertEdgeContract(result.reconciled === true && result.eventId === context.edition.id && result.realizationId === context.realization.id &&
    [result.createdCount, result.promotedCount, result.unchangedCount].every(value => Number.isInteger(value) && value >= 0) &&
    Array.isArray(result.createdProgramItemIds) && result.createdProgramItemIds.length === result.createdCount &&
    new Set(result.createdProgramItemIds).size === result.createdCount,
  'staffingReconciliation', 'the postrelease result for the same realization and Edition');
  result.createdProgramItemIds.forEach(id => readEdgeUuid(id, 'staffingReconciliation.programItemId'));
}

export function assertStaffingEventReadback(snapshot: StaffingEventSyncSnapshot, context: StaffingEventSyncContext,
  confirmation: StaffingEventSyncConfirmation | null): void {
  const { core, edition, timeline } = snapshot;
  assertEdgeContract(core.id === context.edition.eventCoreId && edition.id === context.edition.id &&
    edition.eventCoreId === core.id && edition.isStaffingConverted && core.editions.length === 1 &&
    core.editions[0].id === edition.id && timeline.eventId === edition.id && timeline.eventCoreId === core.id &&
    timeline.origin === 'staffing' && timeline.timezone === edition.timezone &&
    timeline.eventStartTime === formatTimeLabel(edition.startTime) && timeline.eventEndTime === formatTimeLabel(edition.endTime),
  'staffingSync.readback', 'the canonical Core, single converted Edition and its timeline');
  const ids = new Set(edition.occurrences.map(row => row.id));
  const dates = new Set(edition.occurrences.map(row => row.date));
  assertEdgeContract(ids.size === edition.occurrences.length && dates.size === ids.size &&
    timeline.occurrences.length === ids.size && new Set(timeline.occurrences.map(row => row.occurrenceId)).size === ids.size &&
    timeline.occurrences.every(row => edition.occurrences.some(occurrence => occurrence.id === row.occurrenceId &&
      occurrence.date === row.date && occurrence.status === row.status)), 'staffingSync.readback', 'the same unique occurrences in Edition and Timeline');
  const programIds = timeline.occurrences.flatMap(day => day.rows.flatMap(row => row.programItemId ? [row.programItemId] : []));
  assertEdgeContract(new Set(programIds).size === programIds.length, 'staffingSync.program', 'unique current programme identities');
  if (context.kind === 'private') assertPrivateReadback(snapshot, context, confirmation?.kind === 'private' ? confirmation.result : null);
  else {
    assertEdgeContract(edition.isStaffingReleased && edition.currentlyPublic && edition.isActive && core.isActive && core.hasPublicPage,
      'staffingReconciliation.readback', 'the released public Staffing Event');
    if (confirmation?.kind === 'released') {
      assertEdgeContract(confirmation.result.createdProgramItemIds.every(id => programIds.includes(id)),
        'staffingReconciliation.readback', 'all newly created programme items');
    } else assertAssignments(timeline, context, false);
  }
}

function assertPrivateReadback({ core, edition, timeline }: StaffingEventSyncSnapshot, context: StaffingEventSyncContext,
  result: SyncAdminStaffingPrivateEventResult | null): void {
  assertEdgeContract(!core.isActive && !core.hasPublicPage && !edition.isActive && !edition.isDefaultPublic &&
    !edition.isStaffingReleased && !edition.currentlyPublic && edition.schedule.kind === 'exact_dates' &&
    edition.schedule.dates.length === context.schedule.days.length && new Set(edition.schedule.dates).size === edition.schedule.dates.length &&
    context.schedule.days.every(day => edition.schedule.kind === 'exact_dates' && edition.schedule.dates.includes(day.date)) &&
    edition.occurrences.length === context.schedule.days.length && edition.occurrences.every(row =>
      context.schedule.days.some(day => day.date === row.date) && row.status === EventOccurrenceStatus.Planned &&
      row.publishedAt === null && row.activeParticipantCount === 0 &&
      context.edition.occurrences.every(previous => previous.date !== row.date || previous.id === row.id)) &&
    timeline.occurrences.every(row => row.status === EventOccurrenceStatus.Planned && row.participantSignupOpenedAt === null &&
      edition.occurrences.some(occurrence => occurrence.id === row.occurrenceId &&
        occurrence.programItemCount === row.rows.filter(item => item.programItemId !== null).length)),
  'staffingSync.privateReadback', 'the exact saved private dates, retained identities and no publication or signup history');
  if (result) assertEdgeContract(result.occurrences.every(row => edition.occurrences.some(occurrence =>
    occurrence.id === row.occurrenceId && occurrence.date === row.date)), 'staffingSync.readback', 'the confirmed occurrence identities');
  assertAssignments(timeline, context, true);
}

function assertAssignments(timeline: AdminEventTimeline, context: StaffingEventSyncContext, privateDraft: boolean): void {
  for (const day of context.plan.days) {
    const occurrence = timeline.occurrences.find(row => row.date === day.date);
    assertEdgeContract(occurrence !== undefined, 'staffingSync.program', 'a current occurrence for each saved Staffing day');
    if (privateDraft) {
      const sourceDay = context.schedule.days.find(row => row.id === day.dayId && row.date === day.date);
      assertEdgeContract(sourceDay !== undefined && new Set(occurrence.rows.map(row => row.slotId)).size === sourceDay.slots.length &&
        occurrence.rows.every(row => row.source === 'staffing' && row.activeBookings === 0 && row.frozen === false &&
          sourceDay.slots.some(slot => slot.id === row.slotId && slot.label === row.slotLabel && slot.position === row.position &&
            formatTimeLabel(slot.startTime) === row.startTime && formatTimeLabel(slot.endTime) === row.endTime)) &&
        sourceDay.slots.every(slot => occurrence.rows.filter(row => row.slotId === slot.id).length ===
          Math.max(1, day.slots.find(item => item.slotId === slot.id)?.assignments.length ?? 0)) &&
        occurrence.rows.filter(row => row.programItemId !== null).length === day.slots.reduce((count, slot) => count + slot.assignments.length, 0),
      'staffingSync.slots', 'all and only the current saved Staffing slots and programme entries');
    }
    for (const slot of day.slots) for (const assignment of slot.assignments) {
      if (!privateDraft && (!assignment.participationActive || assignment.conflict !== null)) continue;
      const rows = occurrence.rows.filter(row => row.sourceFinalPlanItemId === assignment.id && row.slotId === slot.slotId);
      assertEdgeContract(rows.length === 1 && matchesAssignment(rows[0], assignment, privateDraft),
        'staffingSync.assignment', 'the saved final-plan assignment, GM and effective session in the current programme');
    }
  }
}

function matchesAssignment(row: TimelineRow, assignment: AdminStaffingFinalPlan['days'][number]['slots'][number]['assignments'][number],
  privateDraft: boolean): boolean {
  return row.source === 'staffing' && row.programItemId !== null && row.sourceSessionId === assignment.sessionId &&
    row.sourceKind === assignment.sourceKind && row.host?.userId === assignment.gmUserId &&
    row.session?.title === assignment.effectiveSession.title && row.session.systemId === assignment.effectiveSession.systemId &&
    (privateDraft ? (row.programStatus === EventProgramItemStatus.Approved && row.status === 'pending' &&
      row.candidateState === 'confirmed' && !row.participationEnded &&
      row.session.maxPlayers === assignment.effectiveSession.maxPlayers &&
      row.session.gmDeclaredMaxPlayers === assignment.sessionSnapshot.maxPlayers &&
      row.session.playerCapacityOverride === (assignment.sessionOverride.maxPlayers ?? null))
      : row.programStatus === EventProgramItemStatus.Published && row.status === 'confirmed');
}
