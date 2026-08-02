import {
  ICoworkerOperationalAssignment,
  ICoworkerOperationalPortal,
} from '../../interfaces/i-coworker-operational-document';
import { ICoworkerVersionDownload } from '../../interfaces/i-coworker-document';
import {
  COWORKER_OPERATIONAL_ACTION_MODES,
  COWORKER_OPERATIONAL_ACTION_SOURCES,
  COWORKER_OPERATIONAL_ACTIONS,
  COWORKER_OPERATIONAL_ASSIGNMENT_SOURCES,
  COWORKER_OPERATIONAL_ASSIGNMENT_STATUSES,
  COWORKER_OPERATIONAL_DOCUMENT_STATUSES,
  COWORKER_OPERATIONAL_EDGE_ACTION,
  COWORKER_OPERATIONAL_VERSION_STATUSES,
} from '../../types/coworker-operational-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeBase64,
  readEdgeBoolean,
  readEdgeNonNegativeInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  coworkerNotificationFieldReaders,
  documentVersionDownloadFieldReaders,
} from '../../contracts/coworker-documents/coworker-document-readers';
import { assertOperationalAssignmentContract } from './coworker-operational-assignment.contract';
import { assertOperationalPortalContract } from './coworker-operational-portal.contract';

const trueReader = createEdgeLiteralReader([true] as const);
const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const nullableSha256Reader = createEdgeNullableReader(
  (value, path) => readEdgeBase64(value, path, 32),
);
const nullablePositiveIntegerReader = createEdgeNullableReader(
  readEdgePositiveInteger,
);

const actionReader = createEdgeLiteralReader(COWORKER_OPERATIONAL_ACTIONS);
const actionModeReader = createEdgeLiteralReader(
  COWORKER_OPERATIONAL_ACTION_MODES,
);
const assignmentStatusReader = createEdgeLiteralReader(
  COWORKER_OPERATIONAL_ASSIGNMENT_STATUSES,
);

const documentReader = createEdgeObjectReader({
  id: readEdgeUuid,
  code: readEdgeString,
  title: readEdgeString,
  description: readEdgeNullableString,
  category: readEdgeString,
  status: createEdgeLiteralReader(COWORKER_OPERATIONAL_DOCUMENT_STATUSES),
  currentPublishedVersionId: nullableUuidReader,
});

const fileReader = createEdgeObjectReader({
  originalFilename: readEdgeString,
  declaredMimeType: readEdgeString,
  detectedMimeType: readEdgeNullableString,
  sizeBytes: nullablePositiveIntegerReader,
  contentSha256Base64: nullableSha256Reader,
});

const versionReader = createEdgeObjectReader({
  id: readEdgeUuid,
  versionNumber: readEdgePositiveInteger,
  status: createEdgeLiteralReader(COWORKER_OPERATIONAL_VERSION_STATUSES),
  title: readEdgeString,
  summary: readEdgeNullableString,
  actionMode: actionModeReader,
  requiresReacceptance: readEdgeBoolean,
  statementVersion: readEdgePositiveInteger,
  actionDueAt: readEdgeNullableTimestamp,
  publishedAt: readEdgeNullableTimestamp,
  file: fileReader,
});

const statementReader = createEdgeObjectReader({
  id: readEdgeUuid,
  action: actionReader,
  statementVersion: readEdgePositiveInteger,
  text: readStatementText,
  sha256Base64: (value, path) => readEdgeBase64(value, path, 32),
});

const currentActionReader = createEdgeObjectReader({
  id: readEdgeUuid,
  action: actionReader,
  statementId: readEdgeUuid,
  statementVersion: readEdgePositiveInteger,
  statementSha256Base64: (value, path) => readEdgeBase64(value, path, 32),
  statementText: readStatementText,
  declineReason: readEdgeNullableString,
  source: createEdgeLiteralReader(COWORKER_OPERATIONAL_ACTION_SOURCES),
  actorUserId: readEdgeUuid,
  actedAt: readEdgeTimestamp,
});

const inheritedAssignmentReader = createEdgeObjectReader({
  assignmentId: readEdgeUuid,
  documentVersionId: readEdgeUuid,
  versionNumber: readEdgePositiveInteger,
  status: assignmentStatusReader,
  acknowledgedAt: readEdgeNullableTimestamp,
  acceptedAt: readEdgeNullableTimestamp,
});

const assignmentObjectReader = createEdgeObjectReader({
  id: readEdgeUuid,
  userId: readEdgeUuid,
  documentId: readEdgeUuid,
  documentVersionId: readEdgeUuid,
  assignmentSource: createEdgeLiteralReader(
    COWORKER_OPERATIONAL_ASSIGNMENT_SOURCES,
  ),
  actionMode: actionModeReader,
  status: assignmentStatusReader,
  assignedAt: readEdgeTimestamp,
  dueAt: readEdgeNullableTimestamp,
  acknowledgedAt: readEdgeNullableTimestamp,
  acceptedAt: readEdgeNullableTimestamp,
  declinedAt: readEdgeNullableTimestamp,
  declineReason: readEdgeNullableString,
  waivedAt: readEdgeNullableTimestamp,
  waiverReason: readEdgeNullableString,
  satisfiedByAssignmentId: nullableUuidReader,
  satisfiedByPreviousVersion: readEdgeBoolean,
  document: documentReader,
  version: versionReader,
  statements: createEdgeArrayReader(statementReader),
  currentAction: createEdgeNullableReader(currentActionReader),
  inheritedFrom: createEdgeNullableReader(inheritedAssignmentReader),
  isCurrentPublishedVersion: readEdgeBoolean,
  canAct: readEdgeBoolean,
  downloadAvailable: readEdgeBoolean,
  createdAt: readEdgeTimestamp,
  updatedAt: readEdgeTimestamp,
});

export const coworkerOperationalAssignmentReader:
  EdgeReader<ICoworkerOperationalAssignment> = (value, path) => {
    const assignment = readAssignmentVariant(
      assignmentObjectReader(value, path),
      path,
    );
    assertEdgeContract(
      assignment.document.id === assignment.documentId,
      `${path}.document.id`,
      'equal to documentId',
    );
    assertEdgeContract(
      assignment.version.id === assignment.documentVersionId,
      `${path}.version.id`,
      'equal to documentVersionId',
    );
    assertOperationalAssignmentContract(assignment, path);
    return assignment;
  };

const operationalNotificationReader = createEdgeObjectReader({
  ...coworkerNotificationFieldReaders,
  entityType: createEdgeLiteralReader(['operational_document'] as const),
});

const portalReader: EdgeReader<ICoworkerOperationalPortal> =
  createEdgeObjectReader({
    userId: readEdgeUuid,
    assignments: createEdgeArrayReader(coworkerOperationalAssignmentReader),
    notifications: createEdgeArrayReader(operationalNotificationReader),
    unreadNotificationCount: readEdgeNonNegativeInteger,
  });

const portalResponseReader = createEdgeObjectReader({
  ok: trueReader,
  portal: portalReader,
});

const recordActionResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    COWORKER_OPERATIONAL_EDGE_ACTION.recordAction,
  ] as const),
  assignment: coworkerOperationalAssignmentReader,
});

const downloadResponseReader = createEdgeObjectReader({
    ok: trueReader,
    action: createEdgeLiteralReader([
      COWORKER_OPERATIONAL_EDGE_ACTION.downloadDocumentVersion,
    ] as const),
    download: createEdgeObjectReader(documentVersionDownloadFieldReaders),
});

export function parseCoworkerOperationalPortal(
  value: unknown,
): ICoworkerOperationalPortal {
  const portal = portalResponseReader(value, 'response').portal;
  assertOperationalPortalContract(portal, 'response.portal');
  return portal;
}

export function parseCoworkerOperationalAssignment(
  value: unknown,
  assignmentId: string,
): ICoworkerOperationalAssignment {
  const assignment = recordActionResponseReader(value, 'response').assignment;
  assertEdgeContract(
    assignment.id === assignmentId,
    'response.assignment.id',
    'equal to the requested assignmentId',
  );
  return assignment;
}

export function parseCoworkerOperationalDownload(
  value: unknown,
  documentVersionId: string,
): ICoworkerVersionDownload {
  const response = downloadResponseReader(value, 'response');
  assertEdgeContract(
    response.download.documentVersionId === documentVersionId,
    'response.download.documentVersionId',
    'equal to the requested documentVersionId',
  );
  return response;
}

function readStatementText(value: unknown, path: string): string {
  const text = readEdgeString(value, path);
  assertEdgeContract(
    text.trim() !== '' && text.length <= 8000,
    path,
    'a non-blank string no longer than 8000 characters',
  );
  return text;
}

function readAssignmentVariant(
  assignment: ReturnType<typeof assignmentObjectReader>,
  path: string,
): ICoworkerOperationalAssignment {
  const status = assignment.status;
  if (assignment.actionMode === 'information_only') {
    assertEdgeContract(
      status === 'available' || status === 'waived' || status === 'expired',
      `${path}.status`,
      `a valid status for actionMode ${assignment.actionMode}`,
    );
    return {
      ...assignment,
      actionMode: 'information_only',
      status,
    };
  }

  if (assignment.actionMode === 'acknowledgement_required') {
    assertEdgeContract(
      status === 'pending' ||
        status === 'acknowledged' ||
        status === 'waived' ||
        status === 'expired',
      `${path}.status`,
      `a valid status for actionMode ${assignment.actionMode}`,
    );
    return {
      ...assignment,
      actionMode: 'acknowledgement_required',
      status,
    };
  }

  assertEdgeContract(
    assignment.actionMode === 'acceptance_required' &&
      (
        status === 'pending' ||
        status === 'accepted' ||
        status === 'declined' ||
        status === 'waived' ||
        status === 'expired'
      ),
    `${path}.status`,
    `a valid status for actionMode ${assignment.actionMode}`,
  );
  return {
    ...assignment,
    actionMode: 'acceptance_required',
    status,
  };
}
