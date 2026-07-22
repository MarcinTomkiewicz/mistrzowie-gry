import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
} from '../../types/admin-operational-document';
import type {
  AdminOperationalAssignmentSummary,
  AdminOperationalStoredVersion,
  ConfigureAdminOperationalVersionPayload,
} from '../../types/admin-operational-version';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeObjectReader,
} from '../../utils/edge-contract';
import { targetKey } from './targets.contract';
import { storedVersionReader } from './version.contract';

const configurationResponseReader = createEdgeObjectReader({
  ok: createEdgeLiteralReader([true] as const),
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.configureVersion,
  ] as const),
  version: storedVersionReader,
});

export function parseConfiguration(
  value: unknown,
  request: ConfigureAdminOperationalVersionPayload,
  source: AdminOperationalStoredVersion,
): AdminOperationalStoredVersion {
  const version = configurationResponseReader(value, 'response').version;
  assertEdgeContract(
    request.documentVersionId === source.id,
    'request.configuration.documentVersionId',
    'the source ready version id',
  );
  assertEdgeContract(
    source.status === 'ready' && version.status === 'ready',
    'response.version.status',
    'ready before and after configuration',
  );
  assertStableVersion(version, source, 'response.version');
  assertEdgeContract(
    version.title === request.title &&
      version.summary === request.summary &&
      version.actionMode === request.actionMode &&
      version.requiresReacceptance === request.requiresReacceptance &&
      version.statementVersion === request.statementVersion &&
      sameTimestamp(version.actionDueAt, request.actionDueAt),
    'response.version',
    'the configured requested version metadata',
  );
  assertEdgeContract(
    sameTargets(version, request),
    'response.version.targets',
    'the exact unique requested stable target-key set',
  );
  assertEdgeContract(
    sameStatements(version, request),
    'response.version.statements',
    'the complete unique requested statement set',
  );
  return version;
}

function assertStableVersion(
  actual: AdminOperationalStoredVersion,
  source: AdminOperationalStoredVersion,
  path: string,
): void {
  assertEdgeContract(
    actual.id === source.id &&
      actual.documentId === source.documentId &&
      actual.versionNumber === source.versionNumber &&
      sameTimestamp(actual.createdAt, source.createdAt),
    path,
    'stable version identity and createdAt',
  );
  assertEdgeContract(
    sameFile(actual.file, source.file),
    `${path}.file`,
    'stable file identity, hash, ETag, and Storage metadata',
  );
  assertEdgeContract(
    sameTimestamp(actual.uploadedAt, source.uploadedAt) &&
      sameTimestamp(actual.finalizedAt, source.finalizedAt) &&
      sameTimestamp(actual.publishedAt, source.publishedAt) &&
      sameTimestamp(actual.supersededAt, source.supersededAt) &&
      sameTimestamp(actual.archivedAt, source.archivedAt),
    path,
    'stable lifecycle timestamps other than updatedAt',
  );
  assertEdgeContract(
    sameAssignmentSummary(actual.assignmentSummary, source.assignmentSummary),
    `${path}.assignmentSummary`,
    'stable assignment summary',
  );
}

function sameFile(
  actual: AdminOperationalStoredVersion['file'],
  source: AdminOperationalStoredVersion['file'],
): boolean {
  return actual.originalFilename === source.originalFilename &&
    actual.storedFilename === source.storedFilename &&
    actual.fileExtension === source.fileExtension &&
    actual.declaredMimeType === source.declaredMimeType &&
    actual.detectedMimeType === source.detectedMimeType &&
    actual.expectedSizeBytes === source.expectedSizeBytes &&
    actual.sizeBytes === source.sizeBytes &&
    actual.contentSha256Base64 === source.contentSha256Base64 &&
    actual.malwareScanStatus === source.malwareScanStatus &&
    actual.storage.bucket === source.storage.bucket &&
    actual.storage.path === source.storage.path &&
    actual.storage.objectEtag === source.storage.objectEtag;
}

function sameAssignmentSummary(
  actual: AdminOperationalAssignmentSummary,
  source: AdminOperationalAssignmentSummary,
): boolean {
  return actual.total === source.total &&
    actual.available === source.available &&
    actual.pending === source.pending &&
    actual.acknowledged === source.acknowledged &&
    actual.accepted === source.accepted &&
    actual.declined === source.declined;
}

function sameTargets(
  actual: AdminOperationalStoredVersion,
  request: ConfigureAdminOperationalVersionPayload,
): boolean {
  const actualKeys = actual.targets.map(targetKey);
  const expectedKeys = request.targets.map(targetKey);
  return actualKeys.length === expectedKeys.length &&
    new Set(actualKeys).size === actualKeys.length &&
    new Set(expectedKeys).size === expectedKeys.length &&
    actualKeys.every((key) => expectedKeys.includes(key));
}

function sameStatements(
  actual: AdminOperationalStoredVersion,
  request: ConfigureAdminOperationalVersionPayload,
): boolean {
  const actualKeys = actual.statements.map(
    (statement) =>
      `${statement.action}\u0000${statement.statementVersion}\u0000${statement.text}`,
  );
  const expectedKeys = request.statements.map(
    (statement) =>
      `${statement.action}\u0000${request.statementVersion}\u0000${statement.text}`,
  );
  return actualKeys.length === expectedKeys.length &&
    new Set(actualKeys).size === actualKeys.length &&
    new Set(expectedKeys).size === expectedKeys.length &&
    actualKeys.every((key) => expectedKeys.includes(key));
}

function sameTimestamp(left: string | null, right: string | null): boolean {
  return left === null || right === null
    ? left === right
    : Date.parse(left) === Date.parse(right);
}
