import type { AdminGlobalEventPagePreview, AdminGlobalEventPreviewPage } from '../../interfaces/i-admin-global-event-preview';
import type { GlobalTimeBlockInput } from '../../interfaces/i-admin-global-event';
import { isValidIsoDate } from '../../utils/date';
import {
  assertEdgeContract, readEdgeArray, readEdgeBoolean, readEdgeInteger, readEdgeLiteral,
  readEdgeNullableBoolean, readEdgeNullableInteger, readEdgeNullableString, readEdgeObject, readEdgeString, readEdgeUuid,
} from '../../utils/edge-contract';
import { isValidTime } from '../../utils/time-format';
import { decodePublicEventProgram } from './public-event-program.contract';
import { EVENT_PRICE_BASES } from '../../configs/events.config';

export function readAdminGlobalEventPagePreview(
  result: AdminGlobalEventPagePreview, coreId: string, editionId?: string, date?: string,
): AdminGlobalEventPagePreview {
  readEdgeObject(result, 'globalPagePreview');
  assertEdgeContract(result.preview === true && result.coreId === coreId && result.appliedToPublic === false,
    'globalPagePreview', 'a read-only preview of the requested Core');
  readEdgeUuid(result.coreId, 'globalPagePreview.coreId');
  readEdgeArray(result.fieldErrors, 'globalPagePreview.fieldErrors');
  readEdgeArray(result.blockers, 'globalPagePreview.blockers');
  for (const issue of result.fieldErrors) {
    const codes = {
      coreDraft: 'INVALID_CORE_METADATA', editionDrafts: 'INVALID_EDITION_METADATA', selectedDate: 'INVALID_SELECTED_DATE',
      calendarDraft: 'INVALID_PREVIEW_CALENDAR', policy: 'INVALID_POLICY_DRAFT', cityOverrides: 'INCOMPATIBLE_SIGNUP_CAPACITY',
    };
    readEdgeObject(issue, 'globalPagePreview.fieldError');
    assertEdgeContract(Object.hasOwn(codes, issue.field) && codes[issue.field] === issue.code,
      'globalPagePreview.fieldError', 'a documented field error');
    keys(issue, ['field', 'code', ...(issue.field === 'editionDrafts' || issue.field === 'cityOverrides' ? ['editionId'] : []),
      ...(issue.field === 'calendarDraft' || issue.field === 'policy' ? ['detail'] : [])]);
    if ('editionId' in issue) readEdgeUuid(issue.editionId, 'globalPagePreview.fieldError.editionId');
    if ('detail' in issue) readEdgeString(issue.detail, 'globalPagePreview.fieldError.detail');
  }
  for (const blocker of result.blockers) {
    readEdgeObject(blocker, 'globalPagePreview.blocker');
    readEdgeLiteral(blocker.code, 'globalPagePreview.blocker.code', [
      'STALE_SAVED_POLICY_DRAFT', 'PUBLISHED_POLICY_WRITE_NOT_RELEASED', 'STALE_SAVED_CALENDAR_DRAFT',
      'GLOBAL_CALENDAR_WRITE_NOT_RELEASED', 'NO_UPCOMING_DATE_FOR_SELECTED_CITY', 'EDITION_EFFECTIVE_POLICY_MISSING', 'PROTECTED_PARTICIPANT_POLICY',
    ]);
    keys(blocker, ['code', ...(['EDITION_EFFECTIVE_POLICY_MISSING', 'PROTECTED_PARTICIPANT_POLICY'].includes(blocker.code) ? ['editionId'] : [])]);
    if ('editionId' in blocker) readEdgeUuid(blocker.editionId, 'globalPagePreview.blocker.editionId');
  }
  const status = result.fieldErrors.length ? 'invalid' : result.blockers.length ? 'blocked' : 'preview_ready';
  assertEdgeContract(result.status === status && result.valid === (status === 'preview_ready'),
    'globalPagePreview.status', 'the status derived from the returned field errors and blockers');
  const baseKeys = ['preview', 'valid', 'status', 'coreId', 'fieldErrors', 'blockers', 'page', 'appliedToPublic'];
  if (result.page === null) {
    keys(result, baseKeys);
    assertEdgeContract(result.status === 'invalid' && result.fieldErrors.some(issue => issue.code === 'INVALID_PREVIEW_CALENDAR'),
      'globalPagePreview.page', 'the explicit early invalid-calendar null branch');
    return result;
  }
  keys(result, [...baseKeys, 'calendarLifecycle', 'sources', 'currentlyPublic', 'participantSignupOpened']);
  readEdgeString(result.calendarLifecycle, 'globalPagePreview.calendarLifecycle');
  readEdgeBoolean(result.currentlyPublic, 'globalPagePreview.currentlyPublic');
  assertEdgeContract(result.participantSignupOpened === false, 'globalPagePreview.participantSignupOpened', 'false');
  keys(result.sources, ['core', 'editions', 'policy', 'calendar']);
  for (const source of [result.sources.core, result.sources.editions]) readEdgeLiteral(source, 'globalPagePreview.source', ['canonical', 'unsaved']);
  for (const source of [result.sources.policy, result.sources.calendar]) readEdgeLiteral(source, 'globalPagePreview.source', ['canonical', 'saved_draft', 'unsaved']);
  const page = result.page;
  assertPage(page);
  assertEdgeContract(page.core.id === coreId && (editionId === undefined || page.selectedEditionId === editionId) &&
    (date === undefined || page.selectedDate === date), 'globalPagePreview.selection', 'the requested Core, Edition and date');
  const program = decodePublicEventProgram(page.program);
  assertEdgeContract(program.every(entry => entry.occurrenceId === page.selectedOccurrenceId && entry.occurrenceDate === page.selectedDate),
    'globalPagePreview.program', 'only the selected real occurrence and date');
  const ids = program.flatMap(entry => 'activityId' in entry ? [entry.activityId] : entry.programItemId ? [entry.programItemId] : []);
  assertEdgeContract(new Set(ids).size === ids.length, 'globalPagePreview.program', 'unique programme identities');
  return { ...result, page: { ...page, program } };
}

function assertPage(page: AdminGlobalEventPreviewPage): void {
  keys(page, ['core', 'defaultEventId', 'editions', 'globalDates', 'timeBlocks', 'selectedEditionId', 'selectedDate', 'selectedOccurrenceId', 'program']);
  keys(page.core, ['id', 'key', 'name', 'shortDescription', 'longDescription', 'coverImagePath']);
  readEdgeUuid(page.core.id, 'preview.core.id');
  readEdgeString(page.core.key, 'preview.core.key');
  for (const text of [page.core.name, page.core.shortDescription, page.core.longDescription, page.core.coverImagePath]) readEdgeNullableString(text, 'preview.core.text');
  readEdgeUuid(page.defaultEventId, 'preview.defaultEventId');
  readEdgeUuid(page.selectedEditionId, 'preview.selectedEditionId');
  if (page.selectedDate !== null) isoDate(page.selectedDate);
  if (page.selectedOccurrenceId !== null) readEdgeUuid(page.selectedOccurrenceId, 'preview.selectedOccurrenceId');
  readEdgeArray(page.editions, 'preview.editions');
  readEdgeArray(page.globalDates, 'preview.globalDates');
  assertEdgeContract(new Set(page.editions.map(city => city.id)).size === page.editions.length &&
    page.editions.some(city => city.id === page.selectedEditionId) && page.editions.some(city => city.id === page.defaultEventId),
  'preview.editions', 'unique Editions including the selected and default Edition');
  for (const city of page.editions) {
    keys(city, ['id', 'slug', 'city', 'isMain', 'venueName', 'venueAddress', 'facebookLink', 'timezone', 'startTime', 'endTime',
      'endDayOffset', 'priceAmount', 'priceCurrency', 'priceBasis', 'coverImagePath', 'isForBeginners', 'participantSignupKind',
      'signupRequired', 'sessionCapacityCeiling', 'wholeEventCapacity', 'isPublicNow']);
    readEdgeUuid(city.id, 'preview.edition.id');
    for (const text of [city.slug, city.city, city.timezone]) readEdgeString(text, 'preview.edition.text');
    for (const text of [city.venueName, city.venueAddress, city.facebookLink, city.coverImagePath, city.priceCurrency, city.priceBasis,
      city.participantSignupKind]) readEdgeNullableString(text, 'preview.edition.text');
    readEdgeBoolean(city.isMain, 'preview.edition.isMain');
    readEdgeBoolean(city.isPublicNow, 'preview.edition.isPublicNow');
    readEdgeNullableBoolean(city.isForBeginners, 'preview.edition.isForBeginners');
    readEdgeNullableBoolean(city.signupRequired, 'preview.edition.signupRequired');
    if (city.priceBasis !== null) readEdgeLiteral(city.priceBasis, 'preview.edition.priceBasis', EVENT_PRICE_BASES);
    for (const count of [city.sessionCapacityCeiling, city.wholeEventCapacity, city.endDayOffset]) readEdgeNullableInteger(count, 'preview.edition.count');
    assertEdgeContract(city.priceAmount === null || (typeof city.priceAmount === 'number' && Number.isFinite(city.priceAmount) && city.priceAmount >= 0),
      'preview.edition.priceAmount', 'a non-negative amount or null');
    for (const time of [city.startTime, city.endTime]) assertEdgeContract(time === null || isValidTime(time), 'preview.edition.time', 'a local time or null');
  }
  assertEdgeContract(new Set(page.globalDates.map(day => day.date)).size === page.globalDates.length, 'preview.globalDates', 'unique shared dates');
  for (const day of page.globalDates) {
    keys(day, ['date', 'globalOccurrenceId', 'timeBlocks', 'cities']);
    isoDate(day.date);
    if (day.globalOccurrenceId !== null) readEdgeUuid(day.globalOccurrenceId, 'preview.globalOccurrenceId');
    if (day.timeBlocks !== null) blocks(day.timeBlocks);
    readEdgeArray(day.cities, 'preview.globalDate.cities');
    assertEdgeContract(new Set(day.cities.map(city => city.editionId)).size === day.cities.length, 'preview.globalDate.cities', 'unique city participation');
    for (const city of day.cities) {
      keys(city, ['editionId', 'occurrenceId', 'includedInPreview', 'isPublicNow', 'timeBlocks']);
      readEdgeUuid(city.editionId, 'preview.city.editionId');
      assertEdgeContract(page.editions.some(edition => edition.id === city.editionId), 'preview.city.editionId', 'an Edition in this preview');
      if (city.occurrenceId !== null) readEdgeUuid(city.occurrenceId, 'preview.city.occurrenceId');
      readEdgeBoolean(city.includedInPreview, 'preview.city.includedInPreview');
      readEdgeBoolean(city.isPublicNow, 'preview.city.isPublicNow');
      if (city.timeBlocks !== null) blocks(city.timeBlocks);
    }
  }
  const selected = page.globalDates.find(day => day.date === page.selectedDate)?.cities.find(city => city.editionId === page.selectedEditionId);
  assertEdgeContract(page.selectedOccurrenceId === null || (selected?.includedInPreview === true && selected.occurrenceId === page.selectedOccurrenceId),
    'preview.selectedOccurrenceId', 'the selected included city/date occurrence');
  blocks(page.timeBlocks);
}

function blocks(value: GlobalTimeBlockInput[]): void {
  readEdgeArray(value, 'preview.timeBlocks');
  for (const block of value) {
    keys(block, ['position', 'label', 'requiredGmCount', 'startDayOffset', 'startTime', 'endDayOffset', 'endTime']);
    readEdgeInteger(block.position, 'preview.block.position');
    readEdgeInteger(block.requiredGmCount, 'preview.block.requiredGmCount');
    readEdgeString(block.label, 'preview.block.label');
    for (const offset of [block.startDayOffset, block.endDayOffset]) {
      assertEdgeContract(Number.isInteger(offset) && offset >= 0 && offset <= 7, 'preview.block.offset', 'an explicit server day offset');
    }
    assertEdgeContract(isValidTime(block.startTime) && isValidTime(block.endTime), 'preview.block.time', 'local block times');
  }
}

function isoDate(value: string): void { assertEdgeContract(isValidIsoDate(value), 'preview.date', 'an ISO date'); }
function keys(value: unknown, expected: readonly string[]): void {
  const object = readEdgeObject(value, 'globalPagePreview');
  assertEdgeContract(Object.keys(object).length === expected.length && expected.every(key => Object.hasOwn(object, key)),
    'globalPagePreview', 'the exact documented preview fields');
}
