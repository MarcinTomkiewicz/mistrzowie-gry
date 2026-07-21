import { ADMIN_OPERATIONAL_VERSION_LIMITS } from '../../configs/admin-coworker-operational-documents.config';
import {
  IAdminOperationalStatement,
  IAdminOperationalStoredVersion,
  IAdminOperationalTarget,
  IAdminOperationalUnpublishedVersion,
} from '../../interfaces/i-admin-coworker-operational-document';
import { APP_ROLES } from '../../types/app-role';
import {
  ADMIN_OPERATIONAL_TARGET_KINDS,
  ADMIN_OPERATIONAL_UNPUBLISHED_STATUSES,
} from '../../types/admin-coworker-operational-document';
import { COWORKER_MALWARE_SCAN_STATUSES } from '../../types/coworker-document';
import {
  COWORKER_OPERATIONAL_ACTION_MODES,
  COWORKER_OPERATIONAL_ACTIONS,
  COWORKER_OPERATIONAL_VERSION_STATUSES,
} from '../../types/coworker-operational-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeArrayOrder,
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLimitedTextReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeBase64,
  readEdgeBoolean,
  readEdgeNonNegativeInteger,
  readEdgeNonBlankString,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const nullableSizeReader = createEdgeNullableReader(readEdgePositiveInteger);
const nullableSha256Reader = createEdgeNullableReader((value, path) =>
  readEdgeBase64(value, path, 32),
);
const nullReader: EdgeReader<null> = (value, path) => {
  assertEdgeContract(value === null, path, 'null');
  return null;
};
const versionTitleReader = createEdgeLimitedTextReader(
  ADMIN_OPERATIONAL_VERSION_LIMITS.titleLength,
  readEdgeNonBlankString,
);
const versionSummaryReader = createEdgeNullableReader(
  createEdgeLimitedTextReader(
    ADMIN_OPERATIONAL_VERSION_LIMITS.summaryLength,
  ),
);
const statementTextReader = createEdgeLimitedTextReader(
  ADMIN_OPERATIONAL_VERSION_LIMITS.statementTextLength,
  readEdgeNonBlankString,
);
const originalFilenameReader = createEdgeLimitedTextReader(
  ADMIN_OPERATIONAL_VERSION_LIMITS.originalFilenameLength,
  readEdgeNonBlankString,
);

const targetObjectReader = createEdgeObjectReader({
  id: readEdgeUuid,
  targetKind: createEdgeLiteralReader(ADMIN_OPERATIONAL_TARGET_KINDS),
  appRole: createEdgeNullableReader(createEdgeLiteralReader(APP_ROLES)),
  userId: nullableUuidReader,
  eventDefinitionId: nullableUuidReader,
  createdAt: readEdgeTimestamp,
});

const targetReader: EdgeReader<IAdminOperationalTarget> = (value, path) => {
  const target = targetObjectReader(value, path);
  switch (target.targetKind) {
    case 'all_active_coworkers':
      assertSelectors(target, path, false, false, false);
      return {
        ...target,
        targetKind: 'all_active_coworkers',
        appRole: null,
        userId: null,
        eventDefinitionId: null,
      };
    case 'app_role':
      assertSelectors(target, path, true, false, false);
      return {
        ...target,
        targetKind: 'app_role',
        appRole: requiredSelector(target.appRole, path),
        userId: null,
        eventDefinitionId: null,
      };
    case 'user':
      assertSelectors(target, path, false, true, false);
      return {
        ...target,
        targetKind: 'user',
        appRole: null,
        userId: requiredSelector(target.userId, path),
        eventDefinitionId: null,
      };
    case 'event_definition':
      assertSelectors(target, path, false, false, true);
      return {
        ...target,
        targetKind: 'event_definition',
        appRole: null,
        userId: null,
        eventDefinitionId: requiredSelector(
          target.eventDefinitionId,
          path,
        ),
      };
  }
};

const statementReader: EdgeReader<IAdminOperationalStatement> =
  createEdgeObjectReader({
    id: readEdgeUuid,
    action: createEdgeLiteralReader(COWORKER_OPERATIONAL_ACTIONS),
    statementVersion: readEdgePositiveInteger,
    text: statementTextReader,
    sha256Base64: (value, path) => readEdgeBase64(value, path, 32),
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

const assignmentSummaryReader = createEdgeObjectReader({
  total: readEdgeNonNegativeInteger,
  available: readEdgeNonNegativeInteger,
  pending: readEdgeNonNegativeInteger,
  acknowledged: readEdgeNonNegativeInteger,
  accepted: readEdgeNonNegativeInteger,
  declined: readEdgeNonNegativeInteger,
});

const versionFileFieldReaders = {
  originalFilename: originalFilenameReader,
  storedFilename: readEdgeNonBlankString,
  fileExtension: readEdgeNonBlankString,
  declaredMimeType: readEdgeNonBlankString,
  detectedMimeType: readEdgeNullableString,
  expectedSizeBytes: readEdgePositiveInteger,
  sizeBytes: nullableSizeReader,
  contentSha256Base64: nullableSha256Reader,
  malwareScanStatus: createEdgeLiteralReader(
    COWORKER_MALWARE_SCAN_STATUSES,
  ),
} as const;

const versionFieldReaders = {
  id: readEdgeUuid,
  documentId: readEdgeUuid,
  versionNumber: readEdgePositiveInteger,
  title: versionTitleReader,
  summary: versionSummaryReader,
  actionMode: createEdgeLiteralReader(COWORKER_OPERATIONAL_ACTION_MODES),
  requiresReacceptance: readEdgeBoolean,
  statementVersion: readEdgePositiveInteger,
  actionDueAt: readEdgeNullableTimestamp,
  targets: createEdgeArrayReader(targetReader),
  statements: createEdgeArrayReader(statementReader),
  assignmentSummary: assignmentSummaryReader,
  uploadedAt: readEdgeNullableTimestamp,
  finalizedAt: readEdgeNullableTimestamp,
  publishedAt: readEdgeNullableTimestamp,
  supersededAt: readEdgeNullableTimestamp,
  archivedAt: readEdgeNullableTimestamp,
  createdAt: readEdgeTimestamp,
  updatedAt: readEdgeTimestamp,
} as const;

const storedVersionObjectReader = createEdgeObjectReader({
  ...versionFieldReaders,
  status: createEdgeLiteralReader(COWORKER_OPERATIONAL_VERSION_STATUSES),
  file: createEdgeObjectReader({
    ...versionFileFieldReaders,
    storage: createEdgeObjectReader({
      bucket: readEdgeNonBlankString,
      path: readEdgeNonBlankString,
      objectEtag: readEdgeNullableString,
    }),
  }),
});

const unpublishedVersionObjectReader = createEdgeObjectReader({
  ...versionFieldReaders,
  status: createEdgeLiteralReader(ADMIN_OPERATIONAL_UNPUBLISHED_STATUSES),
  file: createEdgeObjectReader({ ...versionFileFieldReaders, storage: nullReader }),
});

export const adminOperationalStoredVersionReader:
  EdgeReader<IAdminOperationalStoredVersion> = (value, path) => {
    const version = storedVersionObjectReader(value, path);
    assertVersionContract(version, path);
    return version;
  };

export const adminOperationalUnpublishedVersionReader:
  EdgeReader<IAdminOperationalUnpublishedVersion> = (value, path) => {
    const version = unpublishedVersionObjectReader(value, path);
    assertVersionContract(version, path);
    return version;
  };

function assertVersionContract(
  version:
    | ReturnType<typeof storedVersionObjectReader>
    | ReturnType<typeof unpublishedVersionObjectReader>,
  path: string,
): void {
  assertEdgeArrayOrder(version.targets, compareTargets, `${path}.targets`);
  assertEdgeArrayOrder(
    version.statements,
    compareStatements,
    `${path}.statements`,
  );
  const categorizedAssignments =
    version.assignmentSummary.available +
    version.assignmentSummary.pending +
    version.assignmentSummary.acknowledged +
    version.assignmentSummary.accepted +
    version.assignmentSummary.declined;
  assertEdgeContract(
    categorizedAssignments <= version.assignmentSummary.total,
    `${path}.assignmentSummary`,
    'categorized assignments not exceeding total assignments',
  );
  const actions = version.statements.map((statement) => statement.action);
  assertEdgeContract(
    new Set(actions).size === actions.length,
    `${path}.statements`,
    'unique statement actions',
  );
  if (!isConfiguredVersion(version.status)) return;

  assertEdgeContract(
    version.targets.length > 0,
    `${path}.targets`,
    'a non-empty configured target set',
  );
  const expectedActions = version.actionMode === 'information_only'
    ? []
    : version.actionMode === 'acknowledgement_required'
      ? ['acknowledged']
      : ['accepted', 'declined'];
  assertEdgeContract(
    sameValues(actions, expectedActions),
    `${path}.statements`,
    'the complete configured action statement set',
  );
}

function isConfiguredVersion(status: string): boolean {
  return status === 'published' || status === 'superseded' || status === 'archived';
}

function assertSelectors(
  target: ReturnType<typeof targetObjectReader>,
  path: string,
  hasRole: boolean,
  hasUser: boolean,
  hasEvent: boolean,
): void {
  assertEdgeContract(
    (target.appRole !== null) === hasRole &&
      (target.userId !== null) === hasUser &&
      (target.eventDefinitionId !== null) === hasEvent,
    path,
    'exactly the selector required by targetKind',
  );
}

function requiredSelector<T>(value: T | null, path: string): T {
  assertEdgeContract(value !== null, path, 'the selector required by targetKind');
  return value;
}

function compareTargets(left: IAdminOperationalTarget, right: IAdminOperationalTarget): number {
  return compareText(left.targetKind, right.targetKind) ||
    compareNullable(left.appRole, right.appRole) ||
    compareNullable(left.userId, right.userId) ||
    compareNullable(left.eventDefinitionId, right.eventDefinitionId) ||
    compareText(left.id, right.id);
}

function compareStatements(
  left: IAdminOperationalStatement,
  right: IAdminOperationalStatement,
): number {
  return compareText(left.action, right.action) || compareText(left.id, right.id);
}

function compareNullable(left: string | null, right: string | null): number {
  if (left === null) return right === null ? 0 : -1;
  return right === null ? 1 : compareText(left, right);
}

function sameValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
