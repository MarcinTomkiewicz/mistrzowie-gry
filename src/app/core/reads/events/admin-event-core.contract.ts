import type { ExistingEventCoreDisposition, IEventCoreDetail, IEventCoreListItem } from '../../interfaces/i-event-admin';
import {
  assertEdgeContract, createEdgeArrayReader, createEdgeNullableReader,
  readEdgeBoolean, readEdgeInteger, readEdgeNonNegativeInteger, readEdgeNullableString,
  readEdgeNullableTimestamp, readEdgeString, readEdgeTimestamp, readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import { readEventCoreDispositionAction, readEventCoreDispositionHash, readEventCoreDispositionItem,
  readExistingEventCoreDispositionReason } from './admin-event-core-disposition.contract';

const identityFields = {
  id: readEdgeUuid, key: readEdgeString, name: readEdgeString, shortDescription: readEdgeNullableString,
  coverImagePath: readEdgeNullableString, isActive: readEdgeBoolean, hasPublicPage: readEdgeBoolean,
  displayOrder: readEdgeInteger, archived: readEdgeBoolean, archivedAt: readEdgeNullableTimestamp,
  everPublished: readEdgeBoolean, createdAt: readEdgeTimestamp, updatedAt: readEdgeTimestamp,
};
const readList = createEdgeArrayReader(createStrictEdgeObjectReader({
  ...identityFields, editionCount: readEdgeNonNegativeInteger, activeEditionCount: readEdgeNonNegativeInteger,
  dispositionAction: readEventCoreDispositionAction,
  dispositionReason: readExistingEventCoreDispositionReason,
  dispositionRevision: readEventCoreDispositionHash,
}));
const readDetail = createStrictEdgeObjectReader({
  ...identityFields, longDescription: readEdgeNullableString, archivedBy: createEdgeNullableReader(readEdgeUuid),
  disposition: readExistingDisposition,
  editions: createEdgeArrayReader(createStrictEdgeObjectReader({
    id: readEdgeUuid, slug: readEdgeString, city: readEdgeString, isActive: readEdgeBoolean,
    isDefaultPublic: readEdgeBoolean, displayOrder: readEdgeInteger, occurrenceCount: readEdgeNonNegativeInteger,
    programItemCount: readEdgeNonNegativeInteger, createdAt: readEdgeTimestamp, updatedAt: readEdgeTimestamp,
  })),
});

function readExistingDisposition(value: unknown, path: string): ExistingEventCoreDisposition {
  const item = readEventCoreDispositionItem(value, path);
  assertEdgeContract(item.reason !== 'NOT_FOUND', path, 'the disposition of an existing Core');
  return item;
}

export function readAdminEventCoreList(value: unknown, includeArchived: boolean): IEventCoreListItem[] {
  const rows = readList(value, 'eventCoreList');
  assertEdgeContract(new Set(rows.map(row => row.id)).size === rows.length, 'eventCoreList.ids', 'unique Core UUIDs');
  for (const row of rows) {
    assertArchiveMetadata(row);
    assertEdgeContract((includeArchived || !row.archived) && row.activeEditionCount <= row.editionCount &&
      (!row.archived || (row.activeEditionCount === 0 && row.dispositionAction === 'blocked' && row.dispositionReason === 'ALREADY_ARCHIVED')),
    'eventCoreList.archive', 'the requested archive filter and consistent server archive state');
  }
  return rows;
}

export function readAdminEventCoreDetail(value: unknown, coreId: string): IEventCoreDetail | null {
  if (value === null) return null;
  const core = readDetail(value, 'eventCoreDetail');
  assertArchiveMetadata(core);
  const item = core.disposition;
  assertEdgeContract(core.id === coreId && item.coreId === coreId && item.coreKey === core.key &&
    item.archived === core.archived && item.archivedAt === core.archivedAt && item.everPublished === core.everPublished &&
    core.archived === (core.archivedBy !== null) && new Set(core.editions.map(edition => edition.id)).size === core.editions.length &&
    (!core.archived || (core.editions.every(edition => !edition.isActive) && item.action === 'blocked' && item.reason === 'ALREADY_ARCHIVED')),
  'eventCoreDetail', 'the requested Core, its unique Editions and consistent archive/disposition metadata');
  return core;
}

function assertArchiveMetadata(core: Pick<IEventCoreDetail, 'archived' | 'archivedAt' | 'everPublished' | 'isActive' | 'hasPublicPage'>): void {
  assertEdgeContract(core.archived === (core.archivedAt !== null) &&
    (!core.archived || (core.everPublished && !core.isActive && !core.hasPublicPage)),
  'eventCore.archive', 'consistent archive timestamps, retained publication history and disabled visibility');
}
