import type {
  PublicEventConfirmedSession,
  PublicEventProgramEntry,
} from '../../types/public-event-program';
import { SessionDifficultyLevel } from '../../types/sessions';
import {
  assertEdgeContract,
  readEdgeArray,
  readEdgeObject,
  readEdgeLiteral,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeBoolean,
  readEdgeInteger,
  readEdgeNullableBoolean,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeString,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import { isValidIsoDate } from '../../utils/date';
import { isValidTime } from '../../utils/time-format';

const readConfirmedSession = createStrictEdgeObjectReader({
  systemId: createEdgeNullableReader(readEdgeUuid),
  title: readEdgeNullableString,
  description: readEdgeNullableString,
  image: readEdgeNullableString,
  difficultyLevel: createEdgeNullableReader(
    createEdgeLiteralReader([
      SessionDifficultyLevel.Beginner,
      SessionDifficultyLevel.Intermediate,
      SessionDifficultyLevel.Advanced,
    ]),
  ),
  minPlayers: readEdgeNullableInteger,
  maxPlayers: readEdgeNullableInteger,
  minAge: readEdgeNullableInteger,
  hasReadyCharacterSheets: readEdgeNullableBoolean,
  allowsScenarioCustomization: readEdgeNullableBoolean,
  gmDeclaredMaxPlayers: readEdgeNullableInteger,
  playerCapacityOverride: readEdgeNullableInteger,
  effectiveCapacity: readEdgeNullableInteger,
  system: createEdgeNullableReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    name: readEdgeString,
    description: readEdgeNullableString,
  })),
  styles: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    slug: readEdgeString,
    label: readEdgeString,
    sortOrder: readEdgeInteger,
    isActive: readEdgeBoolean,
  })),
  triggers: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    slug: readEdgeString,
    label: readEdgeString,
    category: readEdgeNullableString,
    aliases: createEdgeArrayReader(readEdgeString),
    isActive: readEdgeBoolean,
  })),
  languages: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    code: readEdgeString,
    label: readEdgeString,
    flagCode: readEdgeString,
    sortOrder: readEdgeInteger,
    isActive: readEdgeBoolean,
  })),
  characterSheets: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid,
    fileName: readEdgeString,
    storagePath: readEdgeString,
    thumbnailStoragePath: readEdgeNullableString,
    sortOrder: readEdgeInteger,
  })),
});

export function decodePublicEventProgram(value: unknown): PublicEventProgramEntry[] {
  const entries = readEdgeArray(value, 'publicEventProgram').map(readProgramEntry);
  const identities = entries.flatMap(entry => entry.programItemId !== null ? [entry.programItemId]
    : 'activityId' in entry ? [entry.activityId] : []);
  assertEdgeContract(new Set(identities).size === identities.length,
    'publicEventProgram.identities', 'unique programme item and activity identities');
  return entries;
}

function readProgramEntry(value: unknown, index: number): PublicEventProgramEntry {
  const path = `publicEventProgram[${index}]`;
  const object = readEdgeObject(value, path);
  const context = {
    occurrenceId: readEdgeUuid(object['occurrenceId'], `${path}.occurrenceId`),
    occurrenceDate: readEdgeString(object['occurrenceDate'], `${path}.occurrenceDate`),
    displayOrder: readEdgeNullableInteger(object['displayOrder'], `${path}.displayOrder`),
  };
  assertEdgeContract(isValidIsoDate(context.occurrenceDate), `${path}.occurrenceDate`, 'an ISO date');
  const slot = readProgramSlot(object['slot'], `${path}.slot`);
  if (object['kind'] === 'pending') {
    assertProgramKeys(object, ['kind', 'status', 'programItemId', 'occurrenceId', 'occurrenceDate', 'displayOrder',
      'host', 'session', 'slot', 'canSignup'], path);
    assertEdgeContract(object['status'] === 'pending' && object['programItemId'] === null && object['host'] === null &&
      object['session'] === null && object['canSignup'] === false, path, 'a masked pending entry without private programme data');
    const manual = Object.hasOwn(slot, 'startDayOffset') || Object.hasOwn(slot, 'endDayOffset');
    assertProgramKeys(slot, ['label', 'startTime', 'endTime', ...(manual ? ['startDayOffset', 'endDayOffset'] : [])], `${path}.slot`);
    assertEdgeContract(!manual || slot.label === null, `${path}.slot.label`, 'a masked Manual slot label');
    const pending = { ...context, kind: 'pending' as const, status: 'pending' as const,
      programItemId: null, host: null, session: null, canSignup: false as const };
    if (slot.startTime === null) {
      assertEdgeContract(context.displayOrder === null, `${path}.displayOrder`, 'null for a date-only pending entry');
      return { ...pending, displayOrder: null, slot };
    }
    assertEdgeContract(context.displayOrder !== null, `${path}.displayOrder`, 'the actual pending slot position');
    return { ...pending, displayOrder: context.displayOrder, slot };
  }

  if (object['programItemId'] === null) {
    assertProgramKeys(object, ['kind', 'status', 'source', 'activityId', 'programItemId', 'occurrenceId', 'occurrenceDate',
      'displayOrder', 'host', 'session', 'activity', 'slot', 'canSignup', 'participantSignupSupported'], path);
    assertEdgeContract(object['kind'] === 'confirmed' && object['status'] === 'confirmed' && object['source'] === 'manual_activity' &&
      object['host'] === null && object['session'] === null && object['canSignup'] === false && object['participantSignupSupported'] === false &&
      slot.startTime !== null && context.displayOrder !== null, path, 'a confirmed timed non-session activity without signup');
    const activity = createStrictEdgeObjectReader({
      kindKey: readEdgeString, kindLabel: readEdgeString, title: readEdgeString, description: readEdgeString,
      presenter: readEdgeNullableString, attendeeCapacity: readEdgeNullableInteger,
    })(object['activity'], `${path}.activity`);
    assertEdgeContract(!!activity.title.trim() && (activity.attendeeCapacity === null || activity.attendeeCapacity > 0),
      `${path}.activity`, 'a titled activity and its optional positive capacity');
    assertProgramKeys(slot, ['label', 'startTime', 'endTime', 'startDayOffset', 'endDayOffset', 'blockPosition', 'space'], `${path}.slot`);
    return { ...context, kind: 'confirmed', status: 'confirmed', source: 'manual_activity',
      activityId: readEdgeUuid(object['activityId'], `${path}.activityId`), programItemId: null, host: null, session: null,
      canSignup: false, participantSignupSupported: false, activity,
      slot: { ...slot, label: readEdgeString(slot.label, `${path}.slot.label`),
        startDayOffset: readProgramOffset(slot.startDayOffset, `${path}.slot.startDayOffset`),
        endDayOffset: readProgramOffset(slot.endDayOffset, `${path}.slot.endDayOffset`),
        blockPosition: readEdgeNullableInteger(slot.blockPosition, `${path}.slot.blockPosition`),
        space: createEdgeNullableReader(readProgramSpace)(slot.space, `${path}.slot.space`) } };
  }

  const tagged = Object.hasOwn(object, 'kind') || Object.hasOwn(object, 'status');
  assertProgramKeys(object, ['programItemId', 'occurrenceId', 'occurrenceDate', 'displayOrder', 'host', 'slot', 'session',
    ...(tagged ? ['kind', 'status'] : [])], path, tagged ? ['timeScope', 'canSignup', 'participantSignupSupported'] : []);
  if (tagged) {
    readEdgeLiteral(object['kind'], `${path}.kind`, ['confirmed']);
    readEdgeLiteral(object['status'], `${path}.status`, ['confirmed']);
  } else {
    assertProgramKeys(slot, ['label', 'startTime', 'endTime'], `${path}.slot`);
    assertEdgeContract(slot.label === null && slot.startTime !== null, `${path}.slot`, 'the documented untagged programme slot');
  }
  if (Object.hasOwn(object, 'timeScope')) {
    readEdgeLiteral(object['timeScope'], `${path}.timeScope`, [slot.startTime === null ? 'event' : 'timed']);
  }
  for (const key of ['canSignup', 'participantSignupSupported']) {
    if (Object.hasOwn(object, key)) readEdgeLiteral(object[key], `${path}.${key}`, [false]);
  }
  const eventScoped = !tagged || slot.startTime === null;
  const confirmed = { ...context, kind: 'confirmed' as const, status: 'confirmed' as const,
    programItemId: readEdgeUuid(object['programItemId'], `${path}.programItemId`),
    host: readProgramHost(object['host'], `${path}.host`),
    session: readProgramSession(object['session'], `${path}.session`) };
  // The untagged host projection carries the Edition window, not individual session hours.
  if (eventScoped) {
    assertEdgeContract(!tagged || (object['canSignup'] === false && object['participantSignupSupported'] === false),
      `${path}.eventScoped`, 'an untimed confirmed session without participant signup');
    return { ...confirmed, timeScope: 'event', slot: { label: null, startTime: null, endTime: null },
      canSignup: false, participantSignupSupported: false };
  }
  return { ...confirmed, timeScope: 'timed', slot,
    ...(Object.hasOwn(object, 'canSignup') ? { canSignup: false as const } : {}),
    ...(Object.hasOwn(object, 'participantSignupSupported') ? { participantSignupSupported: false as const } : {}) };
}

const readProgramHost = createStrictEdgeObjectReader({ userId: readEdgeUuid, displayName: readEdgeNullableString });
const readProgramSpace = createStrictEdgeObjectReader({ id: readEdgeUuid, name: readEdgeString });

function readProgramSession(value: unknown, path: string): PublicEventConfirmedSession {
  const session = readConfirmedSession(value, path);
  assertEdgeContract(!!session.title?.trim(), `${path}.title`, 'non-blank text');
  return session;
}

function readProgramSlot(value: unknown, path: string) {
  const slot = readEdgeObject(value, path);
  assertProgramKeys(slot, ['label', 'startTime', 'endTime'], path,
    ['space', 'blockId', 'blockPosition', 'startDayOffset', 'endDayOffset']);
  if (slot['startTime'] === null || slot['endTime'] === null) {
    assertProgramKeys(slot, ['label', 'startTime', 'endTime'], path);
    assertEdgeContract(slot['startTime'] === null && slot['endTime'] === null && slot['label'] === null,
      path, 'an untimed entry with an explicitly empty slot');
    return { label: null, startTime: null, endTime: null };
  }
  return {
    label: readEdgeNullableString(slot['label'], `${path}.label`),
    startTime: readProgramTime(slot['startTime'], `${path}.startTime`),
    endTime: readProgramTime(slot['endTime'], `${path}.endTime`),
    ...(Object.hasOwn(slot, 'space') ? { space: createEdgeNullableReader(readProgramSpace)(slot['space'], `${path}.space`) } : {}),
    ...(Object.hasOwn(slot, 'blockId') ? { blockId: createEdgeNullableReader(readEdgeUuid)(slot['blockId'], `${path}.blockId`) } : {}),
    ...(Object.hasOwn(slot, 'blockPosition') ? { blockPosition: readEdgeNullableInteger(slot['blockPosition'], `${path}.blockPosition`) } : {}),
    ...(Object.hasOwn(slot, 'startDayOffset') ? { startDayOffset: readProgramOffset(slot['startDayOffset'], `${path}.startDayOffset`) } : {}),
    ...(Object.hasOwn(slot, 'endDayOffset') ? { endDayOffset: readProgramOffset(slot['endDayOffset'], `${path}.endDayOffset`) } : {}),
  };
}

function readProgramTime(value: unknown, path: string): string {
  const time = readEdgeString(value, path);
  assertEdgeContract(isValidTime(time), path, 'a programme time');
  return time;
}

function readProgramOffset(value: unknown, path: string): number {
  const offset = readEdgeInteger(value, path);
  assertEdgeContract(offset >= 0 && offset <= 7, path, 'a server-provided offset from 0 to 7');
  return offset;
}

function assertProgramKeys(value: unknown, keys: readonly string[], path: string, optional: readonly string[] = []): void {
  const object = readEdgeObject(value, path);
  assertEdgeContract(keys.every(key => Object.hasOwn(object, key)) && Object.keys(object).every(key => keys.includes(key) || optional.includes(key)),
    path, 'the exact documented programme variant');
}
