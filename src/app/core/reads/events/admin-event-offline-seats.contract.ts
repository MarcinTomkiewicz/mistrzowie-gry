import type {
  AdminEventProgramOfflineSeats, AdminEventProgramOfflineSeatsAdjustment, EventOfflineSeatsDelta,
} from '../../interfaces/i-event-admin';
import type { PublicEventPageState } from '../../types/public-event-page';
import { isValidIsoDate } from '../../utils/date';
import {
  assertEdgeContract, createEdgeArrayReader, createEdgeLiteralReader, readEdgeNonNegativeInteger, readEdgeString, readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const inventoryFields = {
  eventId: readEdgeUuid, occurrenceId: readEdgeUuid, programItemId: readEdgeUuid,
  effectiveCapacity: readEdgeNonNegativeInteger, activeOnlineBookings: readEdgeNonNegativeInteger,
  offlineOccupiedSeats: readEdgeNonNegativeInteger, remainingOnlineSeats: readEdgeNonNegativeInteger,
};
const readInventory = createStrictEdgeObjectReader({
  eventId: readEdgeUuid,
  items: createEdgeArrayReader(createStrictEdgeObjectReader({ ...inventoryFields, occurrenceDate: readEdgeString })),
});
const readAdjustment = createStrictEdgeObjectReader({
  ...inventoryFields, delta: createEdgeLiteralReader([-1, 1]), changed: createEdgeLiteralReader([true]),
});

export function readAdminEventOfflineSeats(value: unknown, eventId: string): AdminEventProgramOfflineSeats {
  const inventory = readInventory(value, 'offlineSeats');
  assertEdgeContract(inventory.eventId === eventId && new Set(inventory.items.map(item => item.programItemId)).size === inventory.items.length,
    'offlineSeats.scope', 'the requested Edition and unique programme item identities');
  for (const item of inventory.items) {
    assertEdgeContract(item.eventId === eventId && isValidIsoDate(item.occurrenceDate), 'offlineSeats.item', 'the requested Edition and a real occurrence date');
    assertInventory(item);
  }
  return inventory;
}

export function readAdminEventOfflineSeatsAdjustment(value: unknown, programItemId: string,
  delta: EventOfflineSeatsDelta): AdminEventProgramOfflineSeatsAdjustment {
  const result = readAdjustment(value, 'offlineSeats.adjustment');
  assertEdgeContract(result.programItemId === programItemId && result.delta === delta,
    'offlineSeats.adjustment', 'the exact programme item and atomic delta requested');
  assertInventory(result);
  return result;
}

export function assertOfflineSeatsPublicScope(inventory: AdminEventProgramOfflineSeats,
  page: Extract<PublicEventPageState, { kind: 'ready' }>): void {
  assertEdgeContract(inventory.eventId === page.edition.id && inventory.items.every(item =>
    page.occurrences.some(day => day.id === item.occurrenceId && day.occurrenceDate === item.occurrenceDate) &&
    page.program.some(entry => entry.kind === 'confirmed' && entry.session !== null && entry.programItemId === item.programItemId &&
      entry.occurrenceId === item.occurrenceId && entry.occurrenceDate === item.occurrenceDate)),
  'offlineSeats.programme', 'only canonical confirmed sessions of the public Edition, with matching occurrence IDs and dates');
}

function assertInventory(item: Omit<AdminEventProgramOfflineSeatsAdjustment, 'delta' | 'changed'>): void {
  assertEdgeContract(item.remainingOnlineSeats === Math.max(0, item.effectiveCapacity - item.activeOnlineBookings - item.offlineOccupiedSeats),
    'offlineSeats.inventory', 'the canonical capacity, online/offline counts and remaining inventory');
}
