import {
  ADMIN_OPERATIONAL_UPLOAD_FORMATS,
  ADMIN_OPERATIONAL_VERSION_LIMITS,
} from '../../configs/admin-coworker-operational-documents.config';
import { COWORKER_DOCUMENTS_STORAGE } from '../../configs/coworker-documents.config';
import {
  ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES,
} from '../../types/admin-operational-upload';
import {
  ADMIN_OPERATIONAL_UNPUBLISHED_STATUSES,
  type AdminOperationalStatement,
  type AdminOperationalStoredVersion,
  type AdminOperationalUnpublishedVersion,
} from '../../types/admin-operational-version';
import { COWORKER_MALWARE_SCAN_STATUSES } from '../../types/coworker-document';
import {
  COWORKER_OPERATIONAL_ACTION_MODES,
  COWORKER_OPERATIONAL_ACTIONS,
  COWORKER_OPERATIONAL_VERSION_STATUSES,
} from '../../types/coworker-operational-document';
import type { EdgeReader } from '../../types/edge-contract';
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
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  compareTargets,
  targetKey,
  targetReader,
} from './targets.contract';

const nullReader: EdgeReader<null> = (value, path) => {
  assertEdgeContract(value === null, path, 'null');
  return null;
};
const nullableSizeReader = createEdgeNullableReader(readEdgePositiveInteger);
const nullableSha256Reader = createEdgeNullableReader((value, path) =>
  readEdgeBase64(value, path, 32),
);
const versionTitleReader = createEdgeLimitedTextReader(
  ADMIN_OPERATIONAL_VERSION_LIMITS.titleLength,
  readEdgeNonBlankString,
);
const versionSummaryReader = createEdgeNullableReader(
  createEdgeLimitedTextReader(ADMIN_OPERATIONAL_VERSION_LIMITS.summaryLength),
);
const statementTextReader = createEdgeLimitedTextReader(
  ADMIN_OPERATIONAL_VERSION_LIMITS.statementTextLength,
  readEdgeNonBlankString,
);
const originalFilenameReader = createEdgeLimitedTextReader(
  ADMIN_OPERATIONAL_VERSION_LIMITS.originalFilenameLength,
  readEdgeNonBlankString,
);

const statementReader: EdgeReader<AdminOperationalStatement> =
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

const fileReaders = {
  originalFilename: originalFilenameReader,
  storedFilename: readEdgeNonBlankString,
  fileExtension: readEdgeNonBlankString,
  declaredMimeType: createEdgeLiteralReader(
    ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES,
  ),
  detectedMimeType: createEdgeNullableReader(
    createEdgeLiteralReader(ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES),
  ),
  expectedSizeBytes: readEdgePositiveInteger,
  sizeBytes: nullableSizeReader,
  contentSha256Base64: nullableSha256Reader,
  malwareScanStatus: createEdgeLiteralReader(COWORKER_MALWARE_SCAN_STATUSES),
} as const;

const versionReaders = {
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
  ...versionReaders,
  status: createEdgeLiteralReader(COWORKER_OPERATIONAL_VERSION_STATUSES),
  file: createEdgeObjectReader({
    ...fileReaders,
    storage: createEdgeObjectReader({
      bucket: readEdgeNonBlankString,
      path: readEdgeNonBlankString,
      objectEtag: createEdgeNullableReader(readEdgeNonBlankString),
    }),
  }),
});

const unpublishedVersionObjectReader = createEdgeObjectReader({
  ...versionReaders,
  status: createEdgeLiteralReader(ADMIN_OPERATIONAL_UNPUBLISHED_STATUSES),
  file: createEdgeObjectReader({ ...fileReaders, storage: nullReader }),
});

export const storedVersionReader:
  EdgeReader<AdminOperationalStoredVersion> = (value, path) => {
    const version = storedVersionObjectReader(value, path);
    assertVersionContract(version, path);
    return version;
  };

export const unpublishedVersionReader:
  EdgeReader<AdminOperationalUnpublishedVersion> = (value, path) => {
    const version = unpublishedVersionObjectReader(value, path);
    assertVersionContract(version, path);
    return version;
  };

function assertVersionContract(
  version: AdminOperationalStoredVersion | AdminOperationalUnpublishedVersion,
  path: string,
): void {
  assertEdgeArrayOrder(
    version.targets,
    compareTargets,
    `${path}.targets`,
  );
  assertEdgeArrayOrder(
    version.statements,
    compareStatements,
    `${path}.statements`,
  );
  assertEdgeContract(
    new Set(version.targets.map(targetKey)).size ===
      version.targets.length,
    `${path}.targets`,
    'unique stable target keys',
  );
  assertEdgeContract(
    version.targets.length <= ADMIN_OPERATIONAL_VERSION_LIMITS.targetCount,
    `${path}.targets`,
    `at most ${ADMIN_OPERATIONAL_VERSION_LIMITS.targetCount} targets`,
  );
  assertEdgeContract(
    new Set(version.statements.map((statement) => statement.action)).size ===
      version.statements.length,
    `${path}.statements`,
    'unique statement actions',
  );
  assertAssignmentSummary(version, path);
  assertFileContract(version, path);

  if (
    version.status === 'reserved' ||
    version.status === 'uploaded' ||
    version.status === 'failed' ||
    version.status === 'deleted'
  ) {
    assertEmptyConfiguration(version, path);
  }
  if (version.status === 'reserved') {
    assertZeroAssignments(version, path);
  }
  if (version.status === 'ready') {
    assertReadyVersion(version, path);
  }
  if (
    version.status === 'published' ||
    version.status === 'superseded' ||
    version.status === 'archived'
  ) {
    assertConfiguredStatements(version, path);
  }
}

function assertFileContract(
  version: AdminOperationalStoredVersion | AdminOperationalUnpublishedVersion,
  path: string,
): void {
  const file = version.file;
  const format = ADMIN_OPERATIONAL_UPLOAD_FORMATS.find(
    (candidate) => candidate.mimeType === file.declaredMimeType,
  );
  const extension = file.fileExtension.toLowerCase();
  assertEdgeContract(
    format !== undefined &&
      file.fileExtension === extension &&
      format.extensions.some((candidate) => candidate === extension) &&
      file.originalFilename.toLowerCase().endsWith(`.${extension}`),
    `${path}.file.fileExtension`,
    'the extension allowed for the declared MIME type and filename',
  );
  if (file.storage !== null) {
    assertEdgeContract(
      file.storage.bucket === COWORKER_DOCUMENTS_STORAGE.bucket,
      `${path}.file.storage.bucket`,
      'the frozen coworker-documents bucket',
    );
  }
}

function assertReadyVersion(
  version: AdminOperationalStoredVersion | AdminOperationalUnpublishedVersion,
  path: string,
): void {
  const file = version.file;
  assertEdgeContract(
    file.detectedMimeType === file.declaredMimeType &&
      file.sizeBytes === file.expectedSizeBytes &&
      file.contentSha256Base64 !== null &&
      version.uploadedAt !== null &&
      version.finalizedAt !== null,
    path,
    'the successful finalize file evidence and lifecycle timestamps',
  );
  assertZeroAssignments(version, path);
  if (version.targets.length === 0) {
    assertEdgeContract(
      version.statements.length === 0,
      `${path}.statements`,
      'no statements before target configuration',
    );
    return;
  }
  assertConfiguredStatements(version, path);
}

function assertEmptyConfiguration(
  version: AdminOperationalStoredVersion | AdminOperationalUnpublishedVersion,
  path: string,
): void {
  assertEdgeContract(
    version.targets.length === 0 && version.statements.length === 0,
    path,
    'empty targets and statements before configuration',
  );
}

function assertConfiguredStatements(
  version: AdminOperationalStoredVersion | AdminOperationalUnpublishedVersion,
  path: string,
): void {
  assertEdgeContract(
    version.targets.length >= 1 &&
      version.targets.length <= ADMIN_OPERATIONAL_VERSION_LIMITS.targetCount,
    `${path}.targets`,
    `between 1 and ${ADMIN_OPERATIONAL_VERSION_LIMITS.targetCount} configured targets`,
  );
  const actual = version.statements.map((statement) => statement.action);
  const expected = version.actionMode === 'information_only'
    ? []
    : version.actionMode === 'acknowledgement_required'
      ? ['acknowledged']
      : ['accepted', 'declined'];
  assertEdgeContract(
    actual.length === expected.length &&
      actual.every((action, index) => action === expected[index]),
    `${path}.statements`,
    'the complete action-mode statement set',
  );
  assertEdgeContract(
    version.statements.every(
      (statement) => statement.statementVersion === version.statementVersion,
    ),
    `${path}.statements`,
    'statement versions matching the version metadata',
  );
}

function assertAssignmentSummary(
  version: AdminOperationalStoredVersion | AdminOperationalUnpublishedVersion,
  path: string,
): void {
  const summary = version.assignmentSummary;
  const categorized = summary.available +
    summary.pending +
    summary.acknowledged +
    summary.accepted +
    summary.declined;
  assertEdgeContract(
    categorized <= summary.total,
    `${path}.assignmentSummary`,
    'categorized assignments not exceeding total assignments',
  );
}

function assertZeroAssignments(
  version: AdminOperationalStoredVersion | AdminOperationalUnpublishedVersion,
  path: string,
): void {
  assertEdgeContract(
    Object.values(version.assignmentSummary).every((count) => count === 0),
    `${path}.assignmentSummary`,
    'zero assignments for a Slice 10 draft version',
  );
}

function compareStatements(
  left: AdminOperationalStatement,
  right: AdminOperationalStatement,
): number {
  return compareText(left.action, right.action) || compareText(left.id, right.id);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
