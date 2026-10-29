import { EventOccurrenceStatus, EventProgramItemStatus, ParticipantSignupKind } from '../../enums/event';
import type { AdminEventTimeline, TimelineRow } from '../../interfaces/i-admin-event-timeline';
import { assertEdgeContract, readEdgeInteger, readEdgeObject, readEdgeString, readEdgeUuid } from '../../utils/edge-contract';
import { isValidIsoDate } from '../../utils/date';
import { isValidTime } from '../../utils/time-format';

const rowKeys = ['source', 'slotId', 'programItemId', 'sourceFinalPlanItemId', 'sourceKind', 'sourceSessionId',
  'startTime', 'endTime', 'slotLabel', 'position', 'displayOrder', 'status', 'programStatus', 'host', 'session',
  'frozen', 'participantSignupSupported', 'editable', 'activeBookings', 'updatedAt'];
const manualKeys = ['activity', 'startDayOffset', 'endDayOffset', 'spaceId', 'blockId', 'blockLabel', 'blockPosition', 'spaceName'];

export function assertAdminEventTimeline(timeline: AdminEventTimeline): void {
  exactKeys(timeline, ['eventId', 'eventCoreId', 'timezone', 'eventStartTime', 'eventEndTime', 'origin', 'spaces', 'revision', 'occurrences']);
  readEdgeUuid(timeline.eventId, 'timeline.eventId');
  readEdgeUuid(timeline.eventCoreId, 'timeline.eventCoreId');
  readEdgeString(timeline.timezone, 'timeline.timezone');
  assertEdgeContract(isValidTime(timeline.eventStartTime) && isValidTime(timeline.eventEndTime) &&
    ['staffing', 'manual', 'legacy_host'].includes(timeline.origin) && /^[0-9a-f]{32}$/.test(timeline.revision) &&
    Array.isArray(timeline.spaces) && Array.isArray(timeline.occurrences), 'timeline', 'the frozen admin timeline root');
  for (const space of timeline.spaces) {
    exactKeys(space, ['spaceId', 'name', 'isActive']);
    readEdgeUuid(space.spaceId, 'timeline.spaces.spaceId');
    readEdgeString(space.name, 'timeline.spaces.name');
    assertEdgeContract(typeof space.isActive === 'boolean', 'timeline.spaces.isActive', 'a boolean');
  }
  for (const occurrence of timeline.occurrences) {
    exactKeys(occurrence, ['occurrenceId', 'date', 'status', 'slotCapacity', 'capacityPolicy', 'sessionCapacityCeiling',
      'wholeEventCapacity', 'venueAttendanceCapacity', 'legacySharedParticipantCapacity', 'participantSignupKind',
      'participantSignupOpenedAt', 'updatedAt', 'rows']);
    readEdgeUuid(occurrence.occurrenceId, 'timeline.occurrenceId');
    assertEdgeContract(isValidIsoDate(occurrence.date) && Object.values(EventOccurrenceStatus).includes(occurrence.status) &&
      Object.values(ParticipantSignupKind).includes(occurrence.participantSignupKind) &&
      ['legacy_shared', 'independent'].includes(occurrence.capacityPolicy) && Array.isArray(occurrence.rows),
    'timeline.occurrence', 'a real dated occurrence and its programme rows');
    readEdgeInteger(occurrence.slotCapacity, 'timeline.slotCapacity');
    for (const value of [occurrence.sessionCapacityCeiling, occurrence.wholeEventCapacity,
      occurrence.venueAttendanceCapacity, occurrence.legacySharedParticipantCapacity]) nullableInteger(value);
    timestamp(occurrence.updatedAt);
    if (occurrence.participantSignupOpenedAt !== null) timestamp(occurrence.participantSignupOpenedAt);
    occurrence.rows.forEach(assertRow);
  }
}

function assertRow(row: TimelineRow): void {
  exactKeys(row, [...rowKeys, ...(row.source === 'manual' ? manualKeys
    : row.source === 'staffing' ? ['candidateState', 'participationEnded'] : [])]);
  assertEdgeContract(['manual', 'staffing', 'legacy_host'].includes(row.source) &&
    ['confirmed', 'pending'].includes(row.status) && (row.programStatus === null || Object.values(EventProgramItemStatus).includes(row.programStatus)) &&
    (row.sourceKind === null || ['template', 'custom'].includes(row.sourceKind)) &&
    isValidTime(row.startTime) && isValidTime(row.endTime) && typeof row.editable === 'boolean' &&
    (row.frozen === null || typeof row.frozen === 'boolean') &&
    (row.participantSignupSupported === null || typeof row.participantSignupSupported === 'boolean'),
  'timeline.row', 'the explicit source, row status and separate programme status');
  for (const value of [row.slotId, row.programItemId, row.sourceFinalPlanItemId, row.sourceSessionId]) nullableUuid(value);
  nullableString(row.slotLabel);
  nullableInteger(row.position);
  nullableInteger(row.displayOrder);
  readEdgeInteger(row.activeBookings, 'timeline.activeBookings');
  timestamp(row.updatedAt);
  if (row.host !== null) {
    exactKeys(row.host, ['userId', 'displayName']);
    readEdgeUuid(row.host.userId, 'timeline.host.userId');
    readEdgeString(row.host.displayName, 'timeline.host.displayName');
  }
  if (row.session !== null) {
    exactKeys(row.session, ['title', 'systemId', 'maxPlayers', 'systemName', 'effectiveCapacity',
      ...(row.source === 'legacy_host' ? [] : ['gmDeclaredMaxPlayers', 'playerCapacityOverride'])]);
    nullableString(row.session.title);
    nullableString(row.session.systemName);
    nullableString(row.session.systemId);
    nullableInteger(row.session.effectiveCapacity);
    if (row.source !== 'legacy_host') nullableInteger(row.session.playerCapacityOverride);
  }
  if (row.status === 'confirmed') {
    assertEdgeContract(row.programStatus === EventProgramItemStatus.Published, 'timeline.confirmed', 'a published programme status');
  }
  if (row.source === 'manual') assertManual(row);
  else if (row.source === 'staffing') {
    readEdgeUuid(row.slotId, 'timeline.staffing.slotId');
    assertEdgeContract(row.editable === false && typeof row.frozen === 'boolean' && typeof row.participationEnded === 'boolean' &&
      (row.candidateState === null || ['draft', 'pending', 'confirmed', 'rejected', 'withdrawn'].includes(row.candidateState)),
    'timeline.staffing', 'the Staffing-only flags and candidate state');
  } else {
    assertEdgeContract(row.slotId === null && row.slotLabel === null && row.sourceFinalPlanItemId === null &&
      row.programItemId !== null && row.host !== null && row.session !== null && row.sourceKind !== null &&
      row.programStatus !== null && row.frozen === false && row.editable === false && row.participantSignupSupported === false,
    'timeline.legacy', 'the Legacy row without Manual or Staffing keys');
  }
}

function assertManual(row: Extract<TimelineRow, { source: 'manual' }>): void {
  readEdgeUuid(row.slotId, 'timeline.manual.slotId');
  assertEdgeContract(row.sourceFinalPlanItemId === null && row.participantSignupSupported === false &&
    [row.startDayOffset, row.endDayOffset].every(value => Number.isInteger(value) && value >= 0 && value <= 7),
  'timeline.manual', 'the Manual flags and explicit day offsets');
  nullableUuid(row.spaceId);
  nullableUuid(row.blockId);
  nullableString(row.blockLabel);
  nullableString(row.spaceName);
  nullableInteger(row.blockPosition);
  if (row.activity !== null) {
    const activity = row.activity;
    exactKeys(activity, ['kindKey', 'kindLabel', 'title', 'description', 'presenter', 'attendeeCapacity', 'status', 'participantSignupSupported']);
    for (const value of [activity.kindKey, activity.title, activity.description]) readEdgeString(value, 'timeline.activity.text');
    nullableString(activity.kindLabel);
    nullableString(activity.presenter);
    nullableInteger(activity.attendeeCapacity);
    assertEdgeContract(row.programItemId === null && row.host === null && row.session === null && row.sourceKind === null &&
      row.sourceSessionId === null && activity.participantSignupSupported === false &&
      (activity.attendeeCapacity === null || activity.attendeeCapacity > 0) &&
      [EventProgramItemStatus.Approved, EventProgramItemStatus.Published].includes(activity.status) &&
      row.programStatus === activity.status && row.status === (activity.status === EventProgramItemStatus.Published ? 'confirmed' : 'pending'),
    'timeline.activity', 'the distinct Manual Activity without an RPG session or fabricated host');
  } else if (row.programItemId === null) {
    assertEdgeContract(row.host === null && row.session === null && row.sourceKind === null && row.sourceSessionId === null &&
      row.programStatus === null && row.status === 'pending', 'timeline.emptySlot', 'an unassigned pending Manual slot');
  } else {
    assertEdgeContract(row.programStatus !== null, 'timeline.manualRpg', 'the status of the referenced RPG programme item');
  }
}

function exactKeys(value: unknown, keys: readonly string[]): void {
  const object = readEdgeObject(value, 'timeline');
  assertEdgeContract(Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key)),
    'timeline', `exactly the frozen keys: ${keys.join(', ')}`);
}
function nullableString(value: unknown): void { if (value !== null) readEdgeString(value, 'timeline.text'); }
function nullableUuid(value: unknown): void { if (value !== null) readEdgeUuid(value, 'timeline.id'); }
function nullableInteger(value: unknown): void { if (value !== null) readEdgeInteger(value, 'timeline.integer'); }
function timestamp(value: unknown): void {
  assertEdgeContract(typeof value === 'string' && Number.isFinite(Date.parse(value)), 'timeline.timestamp', 'a serialized timestamp');
}
