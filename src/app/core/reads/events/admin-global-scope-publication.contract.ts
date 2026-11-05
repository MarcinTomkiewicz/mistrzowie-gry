import {
  GLOBAL_SCOPE_PUBLICATION_BLOCKER_FIELDS,
  type AdminGlobalScopePublicationImpact, type AdminGlobalScopePublicationPreview,
  type AdminGlobalScopePublicationResult, type EventGlobalScopePublicationCommand,
} from '../../interfaces/i-admin-global-event-publication';
import { assertEdgeContract, readEdgeInteger, readEdgeObject, readEdgeUuid } from '../../utils/edge-contract';

export function assertGlobalScopePublicationCommand(command: EventGlobalScopePublicationCommand): void {
  readEdgeUuid(command.coreId, 'scopePublication.coreId');
  integer(command.expectedCalendarRevision, true);
  uuidArray(command.editionIds, true);
  uuidArray(command.globalDateIds, true);
}

export function assertGlobalScopePublicationPreview(preview: AdminGlobalScopePublicationPreview,
  command: EventGlobalScopePublicationCommand): void {
  exactKeys(preview, ['valid', 'status', 'coreId', 'calendarRevision', 'editionIds', 'globalDateIds', 'blockers',
    'impact', 'published', 'participantSignupOpened', 'appliedToPublic']);
  uuidArray(preview.editionIds, true);
  uuidArray(preview.globalDateIds, true);
  assertImpact(preview.impact, command);
  assertEdgeContract(preview.coreId === command.coreId && typeof preview.valid === 'boolean' &&
    preview.status === (preview.valid ? 'draft_ready' : 'blocked') && Array.isArray(preview.blockers) &&
    preview.valid === (preview.blockers.length === 0) && preview.published === false &&
    preview.participantSignupOpened === false && preview.appliedToPublic === false &&
    sameOrder(preview.editionIds, command.editionIds) && sameOrder(preview.globalDateIds, command.globalDateIds),
  'scopePublication.preview', 'the exact read-only readiness response for the requested selection');
  if (preview.calendarRevision !== null) integer(preview.calendarRevision, true);
  assertEdgeContract(!preview.valid || preview.calendarRevision === command.expectedCalendarRevision,
    'scopePublication.revision', 'the selected current calendar revision for a valid preview');
  for (const blocker of preview.blockers) {
    readEdgeObject(blocker, 'scopePublication.blocker');
    assertEdgeContract(Object.hasOwn(GLOBAL_SCOPE_PUBLICATION_BLOCKER_FIELDS, blocker.code),
      'scopePublication.blocker.code', 'one of the 28 frozen scoped readiness codes');
    const fields = GLOBAL_SCOPE_PUBLICATION_BLOCKER_FIELDS[blocker.code];
    exactKeys(blocker, ['code', ...fields]);
    const source = readEdgeObject(blocker, 'scopePublication.blocker');
    for (const field of fields) {
      if (field === 'blockPosition') readEdgeInteger(source[field], 'scopePublication.blockPosition');
      else readEdgeUuid(source[field], `scopePublication.${field}`);
    }
  }
}

export function assertGlobalScopePublicationResult(result: AdminGlobalScopePublicationResult,
  command: EventGlobalScopePublicationCommand): void {
  exactKeys(result, ['published', 'alreadyPublished', 'coreId', 'calendarRevision', 'publishedOccurrenceCount',
    'activatedEditionCount', 'legacyCapacityUpgrades', 'mainEditionId', 'impact', 'participantSignupOpened', 'globalSignupReleaseEnabled']);
  readEdgeUuid(result.mainEditionId, 'scopePublication.mainEditionId');
  assertImpact(result.impact, command);
  for (const value of [result.publishedOccurrenceCount, result.activatedEditionCount, result.legacyCapacityUpgrades]) integer(value);
  assertEdgeContract(result.coreId === command.coreId && result.calendarRevision === command.expectedCalendarRevision &&
    result.participantSignupOpened === false && typeof result.globalSignupReleaseEnabled === 'boolean' &&
    ((result.published === true && result.alreadyPublished === false) || (result.published === false && result.alreadyPublished === true)),
  'scopePublication.result', 'a full changed or replay response for the prepared Core and revision');
  assertEdgeContract(result.published
    ? result.publishedOccurrenceCount === result.impact.plannedOccurrenceCount &&
      result.activatedEditionCount === result.impact.willActivateEditionIds.length &&
      result.legacyCapacityUpgrades === result.impact.legacyCapacityUpgrades &&
      result.publishedOccurrenceCount + result.activatedEditionCount > 0
    : result.publishedOccurrenceCount === 0 && result.activatedEditionCount === 0 && result.legacyCapacityUpgrades === 0 &&
      result.impact.plannedOccurrenceCount === 0 && result.impact.legacyCapacityUpgrades === 0 &&
      result.impact.alreadyPublishedOccurrenceCount > 0 && result.impact.willActivateEditionIds.length === 0,
  'scopePublication.effects', 'actual changed counts or the full zero-change replay branch, including activation-only publication');
}

export function sameGlobalScopePublicationImpact(left: AdminGlobalScopePublicationImpact, right: AdminGlobalScopePublicationImpact): boolean {
  return left.plannedOccurrenceCount === right.plannedOccurrenceCount &&
    left.alreadyPublishedOccurrenceCount === right.alreadyPublishedOccurrenceCount &&
    left.legacyCapacityUpgrades === right.legacyCapacityUpgrades && left.excludedSelections === right.excludedSelections &&
    sameOrder([...left.willActivateEditionIds].sort(), [...right.willActivateEditionIds].sort());
}

function assertImpact(impact: AdminGlobalScopePublicationImpact, command: EventGlobalScopePublicationCommand): void {
  exactKeys(impact, ['plannedOccurrenceCount', 'alreadyPublishedOccurrenceCount', 'legacyCapacityUpgrades',
    'excludedSelections', 'willActivateEditionIds']);
  for (const value of [impact.plannedOccurrenceCount, impact.alreadyPublishedOccurrenceCount,
    impact.legacyCapacityUpgrades, impact.excludedSelections]) integer(value);
  uuidArray(impact.willActivateEditionIds);
  assertEdgeContract(impact.willActivateEditionIds.every(id => command.editionIds.includes(id)) &&
    impact.legacyCapacityUpgrades <= impact.plannedOccurrenceCount &&
    impact.plannedOccurrenceCount + impact.alreadyPublishedOccurrenceCount + impact.excludedSelections <=
      command.editionIds.length * command.globalDateIds.length,
  'scopePublication.impact', 'unique selected activation IDs and diagnostic counts bounded by the requested Cartesian scope');
}

function exactKeys(value: unknown, keys: readonly string[]): void {
  const object = readEdgeObject(value, 'scopePublication');
  assertEdgeContract(Object.keys(object).length === keys.length && keys.every(key => Object.hasOwn(object, key)),
    'scopePublication', `exactly the frozen keys: ${keys.join(', ')}`);
}

function integer(value: unknown, positive = false): void {
  readEdgeInteger(value, 'scopePublication.count');
  assertEdgeContract(typeof value === 'number' && value >= (positive ? 1 : 0), 'scopePublication.count', 'a valid nonnegative count or positive revision');
}

function uuidArray(value: string[], nonempty = false): void {
  assertEdgeContract(Array.isArray(value) && (!nonempty || value.length > 0), 'scopePublication.ids', 'a UUID array');
  value.forEach(id => readEdgeUuid(id, 'scopePublication.id'));
  assertEdgeContract(new Set(value).size === value.length, 'scopePublication.ids', 'unique server identities');
}

function sameOrder(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}
