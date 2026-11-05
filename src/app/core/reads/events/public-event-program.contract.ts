import type {
  PublicEventConfirmedSession,
  PublicEventProgramEntry,
  PublicEventProgramWireEntry,
  PublicEventSession,
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

const sessionFieldReaders = {
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
};

const readLegacySession = createStrictEdgeObjectReader(sessionFieldReaders);
const readConfirmedSession = createStrictEdgeObjectReader({
  ...sessionFieldReaders,
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

export function decodePublicEventProgram(
  entries: readonly (PublicEventProgramWireEntry | PublicEventProgramEntry)[],
): PublicEventProgramEntry[] {
  readEdgeArray(entries, 'publicEventProgram');
  return entries.map((entry, index): PublicEventProgramEntry => {
    const path = `publicEventProgram[${index}]`;
    const object = readEdgeObject(entry, path);
    readEdgeUuid(entry.occurrenceId, `${path}.occurrenceId`);
    assertEdgeContract(isValidIsoDate(entry.occurrenceDate), `${path}.occurrenceDate`, 'an ISO date');
    if (entry.displayOrder !== null) readEdgeInteger(entry.displayOrder, `${path}.displayOrder`);
    assertProgramSlot(entry.slot, path);
    if (entry.kind === 'pending') {
      assertProgramKeys(object, ['kind', 'status', 'programItemId', 'occurrenceId', 'occurrenceDate', 'displayOrder', 'host', 'session', 'slot', 'canSignup'], path);
      assertEdgeContract(entry.status === 'pending' && entry.programItemId === null && entry.host === null &&
        entry.session === null && entry.canSignup === false, path, 'a masked pending entry without private programme data');
      const manual = Object.hasOwn(entry.slot, 'startDayOffset') || Object.hasOwn(entry.slot, 'endDayOffset');
      assertProgramKeys(entry.slot, ['label', 'startTime', 'endTime', ...(manual ? ['startDayOffset', 'endDayOffset'] : [])], `${path}.slot`);
      assertEdgeContract(!manual || entry.slot.label === null, `${path}.slot.label`, 'a masked Manual slot label');
      assertEdgeContract(entry.displayOrder === null
        ? entry.slot.label === null && entry.slot.startTime === null && entry.slot.endTime === null
        : entry.slot.startTime !== null && entry.slot.endTime !== null,
      `${path}.slot`, 'the documented timed or date-only pending variant');
      return entry;
    }

    assertEdgeContract(typeof entry.slot.startTime === 'string' && typeof entry.slot.endTime === 'string',
      `${path}.slot`, 'explicit hours for a confirmed programme entry');
    if (entry.programItemId === null) {
      assertProgramKeys(object, ['kind', 'status', 'source', 'activityId', 'programItemId', 'occurrenceId', 'occurrenceDate',
        'displayOrder', 'host', 'session', 'activity', 'slot', 'canSignup', 'participantSignupSupported'], path);
      readEdgeUuid(entry.activityId, `${path}.activityId`);
      readEdgeInteger(entry.displayOrder, `${path}.displayOrder`);
      assertEdgeContract(entry.kind === 'confirmed' && entry.status === 'confirmed' && entry.source === 'manual_activity' &&
        entry.host === null && entry.session === null && entry.canSignup === false && entry.participantSignupSupported === false,
      path, 'a confirmed non-session activity without signup');
      const activity = createStrictEdgeObjectReader({
        kindKey: readEdgeString, kindLabel: readEdgeString, title: readEdgeString, description: readEdgeString,
        presenter: readEdgeNullableString, attendeeCapacity: readEdgeNullableInteger,
      })(entry.activity, `${path}.activity`);
      assertEdgeContract(!!activity.title.trim() && (activity.attendeeCapacity === null || activity.attendeeCapacity > 0),
        `${path}.activity`, 'a titled activity and its optional positive capacity');
      assertProgramKeys(entry.slot, ['label', 'startTime', 'endTime', 'startDayOffset', 'endDayOffset', 'blockPosition', 'space'], `${path}.slot`);
      readEdgeString(entry.slot.label, `${path}.slot.label`);
      return { ...entry, activity };
    }

    assertProgramKeys(object, ['programItemId', 'occurrenceId', 'occurrenceDate', 'displayOrder', 'host', 'slot', 'session',
      ...(entry.kind === 'confirmed' ? ['kind', 'status'] : [])], path,
    entry.kind === 'confirmed' ? ['canSignup', 'participantSignupSupported'] : []);
    readEdgeUuid(entry.programItemId, `${path}.programItemId`);
    const host = createStrictEdgeObjectReader({ userId: readEdgeUuid, displayName: readEdgeNullableString })(entry.host, `${path}.host`);
    if (entry.kind === 'confirmed') {
      assertEdgeContract(entry.status === 'confirmed', `${path}.status`, 'confirmed');
      for (const key of ['canSignup', 'participantSignupSupported']) {
        if (Object.hasOwn(object, key)) readEdgeLiteral(object[key], `${path}.${key}`, [false]);
      }
      const session: PublicEventConfirmedSession = readConfirmedSession(entry.session, `${path}.session`);
      assertEdgeContract(!!session.title?.trim(), `${path}.session.title`, 'non-blank text');
      return { ...entry, host, session };
    }

    assertProgramKeys(entry.slot, ['label', 'startTime', 'endTime'], `${path}.slot`);
    assertEdgeContract(entry.slot.label === null, `${path}.slot.label`, 'the Legacy slot without a label');
    const session: PublicEventSession = readLegacySession(entry.session, `${path}.session`);
    return { ...entry, host, session };
  });
}

function assertProgramSlot(value: unknown, path: string): void {
  const slot = readEdgeObject(value, `${path}.slot`);
  assertProgramKeys(slot, ['label', 'startTime', 'endTime'], `${path}.slot`,
    ['space', 'blockId', 'blockPosition', 'startDayOffset', 'endDayOffset']);
  readEdgeNullableString(slot['label'], `${path}.slot.label`);
  const start = slot['startTime'];
  const end = slot['endTime'];
  assertEdgeContract((start === null && end === null && slot['label'] === null) ||
    (typeof start === 'string' && typeof end === 'string' && isValidTime(start) && isValidTime(end)),
  `${path}.slot`, 'explicit programme hours or a date-only masked slot');
  if (Object.hasOwn(slot, 'space') && slot['space'] !== null) {
    createStrictEdgeObjectReader({ id: readEdgeUuid, name: readEdgeString })(slot['space'], `${path}.slot.space`);
  }
  if (Object.hasOwn(slot, 'blockId') && slot['blockId'] !== null) readEdgeUuid(slot['blockId'], `${path}.slot.blockId`);
  if (Object.hasOwn(slot, 'blockPosition') && slot['blockPosition'] !== null) readEdgeInteger(slot['blockPosition'], `${path}.slot.blockPosition`);
  for (const key of ['startDayOffset', 'endDayOffset']) {
    if (Object.hasOwn(slot, key)) {
      const offset = readEdgeInteger(slot[key], `${path}.slot.${key}`);
      assertEdgeContract(offset >= 0 && offset <= 7, `${path}.slot.${key}`, 'a server-provided offset from 0 to 7');
    }
  }
}

function assertProgramKeys(value: unknown, keys: readonly string[], path: string, optional: readonly string[] = []): void {
  const object = readEdgeObject(value, path);
  assertEdgeContract(keys.every(key => Object.hasOwn(object, key)) && Object.keys(object).every(key => keys.includes(key) || optional.includes(key)),
    path, 'the exact documented programme variant');
}
