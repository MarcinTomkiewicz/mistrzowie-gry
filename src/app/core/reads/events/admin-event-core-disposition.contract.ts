import type {
  AdminEventCoreDispositionPreview, AdminEventCoreDispositionResult, EventCoreDispositionCommand,
  EventCoreDispositionItem,
  EventCoreCoverCleanupJob, EventCoreCoverCleanupReceipt,
} from '../../interfaces/i-event-admin';
import {
  assertEdgeContract, createEdgeArrayReader, createEdgeLiteralReader, readEdgeBoolean, readEdgeNonNegativeInteger,
  readEdgeNullableTimestamp, readEdgeObject, readEdgePositiveInteger, readEdgeString, readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const existingReasons = ['NEVER_PUBLISHED', 'HISTORICALLY_PUBLISHED_OR_PROTECTED', 'ALREADY_ARCHIVED',
  'OFFLINE_SEATS_OCCUPIED', 'STORAGE_CLEANUP_REQUIRED', 'EXTERNAL_NOTIFICATION_REFERENCES'] as const;
export const readEventCoreDispositionAction = createEdgeLiteralReader(['delete', 'archive', 'blocked']);
export const readExistingEventCoreDispositionReason = createEdgeLiteralReader(existingReasons);
const readReason = createEdgeLiteralReader([...existingReasons, 'NOT_FOUND']);
function readNull(value: unknown, path: string): null {
  assertEdgeContract(value === null, path, 'null');
  return null;
}
const readExistingItem = createStrictEdgeObjectReader({
  coreId: readEdgeUuid, coreKey: readEdgeString, action: readEventCoreDispositionAction, reason: readExistingEventCoreDispositionReason,
  everPublished: readEdgeBoolean, archived: readEdgeBoolean, archivedAt: readEdgeNullableTimestamp,
  participantHistoryCount: readEdgeNonNegativeInteger, legacyReservationCount: readEdgeNonNegativeInteger,
  offlineOccupied: readEdgeNonNegativeInteger, storageObjectCount: readEdgeNonNegativeInteger,
  coverReferenceCount: readEdgeNonNegativeInteger, notificationReferenceCount: readEdgeNonNegativeInteger,
  linkedStaffingCount: readEdgeNonNegativeInteger, revision: readEventCoreDispositionHash,
});
const readMissingItem = createStrictEdgeObjectReader({
  coreId: readEdgeUuid, coreKey: readNull, action: createEdgeLiteralReader(['blocked']),
  reason: createEdgeLiteralReader(['NOT_FOUND']), everPublished: readNull, archived: readNull,
  archivedAt: readNull, revision: readNull,
});
const readPreview = createStrictEdgeObjectReader({
  valid: createEdgeLiteralReader([true]), status: createEdgeLiteralReader(['ready', 'blocked']),
  coreIds: createEdgeArrayReader(readEdgeUuid), planHash: readEventCoreDispositionHash,
  impact: createStrictEdgeObjectReader({ deleteCount: readEdgeNonNegativeInteger,
    archiveCount: readEdgeNonNegativeInteger, blockedCount: readEdgeNonNegativeInteger }),
  items: createEdgeArrayReader(readEventCoreDispositionItem), applied: createEdgeLiteralReader([false]),
});
const readResult = createStrictEdgeObjectReader({
  applied: createEdgeLiteralReader([true]), replayed: readEdgeBoolean, requestId: readEdgeUuid,
  planHash: readEventCoreDispositionHash, deletedCount: readEdgeNonNegativeInteger,
  archivedCount: readEdgeNonNegativeInteger, blockedCount: readEdgeNonNegativeInteger,
  items: createEdgeArrayReader(createStrictEdgeObjectReader({ coreId: readEdgeUuid,
    outcome: createEdgeLiteralReader(['deleted', 'archived', 'blocked']), reason: readReason })),
});
export const readEventCoreCoverCleanupJob = createStrictEdgeObjectReader({
  jobId: readEdgeUuid, claimToken: readEdgeUuid,
  bucket: createEdgeLiteralReader(['images', 'event-covers-private']), path: readCleanupPath,
  storageObjectId: readEdgeUuid, attempt: readEdgePositiveInteger,
});
const readCleanupJobs = createEdgeArrayReader(readEventCoreCoverCleanupJob);
const readCleanupReceipt = createStrictEdgeObjectReader({
  jobId: readEdgeUuid, state: createEdgeLiteralReader(['done', 'pending']),
});

function readCleanupPath(value: unknown, path: string): string {
  const key = readEdgeString(value, path);
  // Storage.removeFiles must receive the original key without URL/leading-slash/whitespace normalization.
  assertEdgeContract(key.length > 0 && key === key.trim() && !/^[a-z][a-z\d+.-]*:/i.test(key) &&
    !/[\\\u0000-\u001f\u007f]/.test(key) && key.split('/').every(part => part !== '' && part !== '.' && part !== '..'),
  path, 'an exact relative Storage object key');
  return key;
}

export function assertEventCoreCoverCleanupLimit(limit: number): void {
  assertEdgeContract(Number.isInteger(limit) && limit >= 1 && limit <= 100,
    'disposition.cleanup.limit', 'an integer from 1 to 100');
}

export function readEventCoreCoverCleanupClaim(value: unknown, limit: number): EventCoreCoverCleanupJob[] {
  assertEventCoreCoverCleanupLimit(limit);
  const jobs = readCleanupJobs(value, 'disposition.cleanup.claim');
  assertEdgeContract(jobs.length <= limit &&
    new Set(jobs.map(job => job.jobId.toLowerCase())).size === jobs.length &&
    new Set(jobs.map(job => job.claimToken.toLowerCase())).size === jobs.length &&
    new Set(jobs.map(job => job.storageObjectId.toLowerCase())).size === jobs.length &&
    new Set(jobs.map(job => JSON.stringify([job.bucket, job.path]))).size === jobs.length,
  'disposition.cleanup.claim', 'at most the requested number of distinct jobs, claims and exact Storage objects');
  return jobs;
}

export function readEventCoreCoverCleanupReceipt(value: unknown, jobId: string,
  error: string | null): EventCoreCoverCleanupReceipt {
  const receipt = readCleanupReceipt(value, 'disposition.cleanup.complete');
  assertEdgeContract(receipt.jobId === jobId && receipt.state === (error === null ? 'done' : 'pending'),
    'disposition.cleanup.complete', 'the original job and the state matching the submitted removal result');
  return receipt;
}

export function readEventCoreDispositionHash(value: unknown, path: string): string {
  const hash = readEdgeString(value, path);
  assertEdgeContract(/^[0-9a-f]{32}$/.test(hash), path, 'an opaque lowercase MD5 hash');
  return hash;
}

export function readEventCoreDispositionItem(value: unknown, path: string): EventCoreDispositionItem {
  if (readEdgeObject(value, path)['reason'] === 'NOT_FOUND') return readMissingItem(value, path);
  const item = readExistingItem(value, path);
  assertEdgeContract(item.archived === (item.archivedAt !== null), path, 'consistent archive metadata');
  assertEdgeContract(item.reason === 'NEVER_PUBLISHED' ? item.action === 'delete' && !item.everPublished && !item.archived
    : item.reason === 'HISTORICALLY_PUBLISHED_OR_PROTECTED' ? item.action === 'archive' && !item.archived
    : item.action === 'blocked' && (item.reason !== 'ALREADY_ARCHIVED' || item.archived),
  path, 'a server action consistent with its frozen reason');
  return item;
}

export function assertEventCoreDispositionSelection(ids: readonly string[]): void {
  assertEdgeContract(ids.length >= 1 && ids.length <= 100 && new Set(ids).size === ids.length,
    'disposition.coreIds', '1 to 100 unique Core UUIDs');
  ids.forEach(id => readEdgeUuid(id, 'disposition.coreId'));
}

export function assertEventCoreDispositionCommand(command: EventCoreDispositionCommand,
  preview: AdminEventCoreDispositionPreview): void {
  assertEventCoreDispositionSelection(command.coreIds);
  readEdgeUuid(command.requestId, 'disposition.requestId');
  readEventCoreDispositionHash(command.planHash, 'disposition.planHash');
  assertEdgeContract(preview.status === 'ready' && preview.planHash === command.planHash &&
    preview.coreIds.length === command.coreIds.length && command.coreIds.every(id => preview.coreIds.includes(id)),
  'disposition.command', 'exactly the prepared actionable preview and opaque plan hash');
}

export function readAdminEventCoreDispositionPreview(value: unknown, ids: readonly string[]): AdminEventCoreDispositionPreview {
  const preview = readPreview(value, 'disposition.preview');
  assertEventCoreDispositionSelection(preview.coreIds);
  assertEdgeContract(preview.coreIds.length === ids.length && ids.every(id => preview.coreIds.includes(id)) &&
    preview.coreIds.every((id, index) => index === 0 || preview.coreIds[index - 1] < id) &&
    preview.items.length === ids.length && new Set(preview.items.map(item => item.coreId)).size === ids.length &&
    preview.items.every(item => ids.includes(item.coreId)), 'disposition.preview', 'exactly the requested normalized Core scope');
  const impact = preview.impact;
  assertEdgeContract(impact.deleteCount === preview.items.filter(item => item.action === 'delete').length &&
    impact.archiveCount === preview.items.filter(item => item.action === 'archive').length &&
    impact.blockedCount === preview.items.filter(item => item.action === 'blocked').length &&
    preview.status === (impact.deleteCount + impact.archiveCount > 0 ? 'ready' : 'blocked'),
  'disposition.preview.impact', 'counts and readiness matching every server-classified item');
  return preview;
}

export function readAdminEventCoreDispositionResult(value: unknown, command: EventCoreDispositionCommand,
  preview: AdminEventCoreDispositionPreview): AdminEventCoreDispositionResult {
  assertEventCoreDispositionCommand(command, preview);
  const result = readResult(value, 'disposition.result');
  const outcomes = { delete: 'deleted', archive: 'archived', blocked: 'blocked' } as const;
  assertEdgeContract(result.requestId === command.requestId && result.planHash === command.planHash &&
    result.items.length === command.coreIds.length && new Set(result.items.map(item => item.coreId)).size === result.items.length &&
    result.items.every(item => preview.items.some(expected => expected.coreId === item.coreId &&
      item.outcome === outcomes[expected.action] && item.reason === expected.reason)) &&
    result.deletedCount === preview.impact.deleteCount && result.archivedCount === preview.impact.archiveCount &&
    result.blockedCount === preview.impact.blockedCount,
  'disposition.result', 'a full first/replay receipt matching the confirmed command and preview');
  return result;
}
