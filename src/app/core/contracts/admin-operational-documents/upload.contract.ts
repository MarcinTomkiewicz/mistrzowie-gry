import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
} from '../../types/admin-operational-document';
import {
  type AdminOperationalFinalizeContext,
  type AdminOperationalUploadReservationResult,
  ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES,
  type ReserveAdminOperationalUploadPayload,
} from '../../types/admin-operational-upload';
import type { AdminOperationalStoredVersion } from '../../types/admin-operational-version';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeObjectReader,
  isEdgeObject,
  readEdgeBoolean,
  readEdgeNonBlankString,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { storedVersionReader } from './version.contract';

const trueReader = createEdgeLiteralReader([true] as const);
const completedReader = createEdgeLiteralReader(['completed'] as const);

const reservationResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.reserveUpload,
  ] as const),
  upload: createEdgeObjectReader({
    documentId: readEdgeUuid,
    documentVersionId: readEdgeUuid,
    versionNumber: readEdgePositiveInteger,
    uploadSessionId: readEdgeUuid,
    originalFilename: readEdgeNonBlankString,
    storedFilename: readEdgeNonBlankString,
    declaredMimeType: createEdgeLiteralReader(
      ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES,
    ),
    expectedSizeBytes: readEdgePositiveInteger,
  }),
  signedUpload: createEdgeObjectReader({
    path: readEdgeNonBlankString,
    token: readEdgeNonBlankString,
    signedUrl: readEdgeNonBlankString,
    expiresAt: readEdgeTimestamp,
  }),
});

const finalizationResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.finalizeUpload,
  ] as const),
  result: createEdgeObjectReader({
    uploadSessionId: readEdgeUuid,
    finalized: readEdgeBoolean,
    documentVersion: storedVersionReader,
  }),
});

const cancellationFields = {
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.cancelUpload,
  ] as const),
  uploadSessionId: readEdgeUuid,
  cancelled: readEdgeBoolean,
  cleanupStatus: completedReader,
} as const;
const cancellationResponseReader = createEdgeObjectReader(cancellationFields);
const cleanedCancellationResponseReader = createEdgeObjectReader({
  ...cancellationFields,
  cleanupCompletedAt: readEdgeTimestamp,
});

export function parseReservation(
  value: unknown,
  request: ReserveAdminOperationalUploadPayload,
): AdminOperationalUploadReservationResult {
  const response = reservationResponseReader(value, 'response');
  const upload = response.upload;
  assertEdgeContract(
    upload.documentId === request.documentId &&
      upload.originalFilename === request.originalFilename &&
      upload.declaredMimeType === request.declaredMimeType &&
      upload.expectedSizeBytes === request.sizeBytes,
    'response.upload',
    'the reserved document and normalized file metadata',
  );
  return {
    upload: response.upload,
    signedUpload: response.signedUpload,
  };
}

export function parseFinalization(
  value: unknown,
  context: AdminOperationalFinalizeContext,
): AdminOperationalStoredVersion {
  const result = finalizationResponseReader(value, 'response').result;
  const uploadSessionId = context.kind === 'reservation'
    ? context.reservation.upload.uploadSessionId
    : context.recovery.uploadSessionId;
  assertEdgeContract(
    result.uploadSessionId === uploadSessionId && result.finalized,
    'response.result',
    'the finalized requested upload session',
  );
  if (context.kind === 'reservation') {
    assertReservedFinalization(
      result.documentVersion,
      context.upload,
      context.reservation,
      'response.result.documentVersion',
    );
  } else {
    assertEdgeContract(
      context.recovery.canFinalize &&
        result.documentVersion.documentId === context.documentId &&
        result.documentVersion.id === context.recovery.documentVersionId &&
        result.documentVersion.status === 'ready',
      'response.result.documentVersion',
      'the ready version correlated with the recovered document upload',
    );
  }
  assertFinalizedDraft(
    result.documentVersion,
    'response.result.documentVersion',
  );
  return result.documentVersion;
}

export function parseCancellation(
  value: unknown,
  uploadSessionId: string,
): void {
  const result = isEdgeObject(value) && 'cleanupCompletedAt' in value
    ? cleanedCancellationResponseReader(value, 'response')
    : cancellationResponseReader(value, 'response');
  assertEdgeContract(
    result.uploadSessionId === uploadSessionId && result.cancelled,
    'response',
    'the cancelled requested upload session with completed cleanup',
  );
}

function assertReservedFinalization(
  version: AdminOperationalStoredVersion,
  request: ReserveAdminOperationalUploadPayload,
  reservation: AdminOperationalUploadReservationResult,
  path: string,
): void {
  const reserved = reservation.upload;
  assertEdgeContract(
    reserved.documentId === request.documentId &&
      reserved.originalFilename === request.originalFilename &&
      reserved.declaredMimeType === request.declaredMimeType &&
      reserved.expectedSizeBytes === request.sizeBytes &&
      version.documentId === reserved.documentId &&
      version.id === reserved.documentVersionId &&
      version.versionNumber === reserved.versionNumber &&
      version.status === 'ready',
    path,
    'the exact reserved document, version, and file identity',
  );
  assertEdgeContract(
    version.title === request.title &&
      version.summary === request.summary &&
      version.actionMode === request.actionMode &&
      version.requiresReacceptance === request.requiresReacceptance &&
      version.statementVersion === request.statementVersion &&
      sameTimestamp(version.actionDueAt, request.actionDueAt),
    path,
    'the metadata sent with the reservation',
  );
  assertEdgeContract(
    version.file.originalFilename === reserved.originalFilename &&
      version.file.storedFilename === reserved.storedFilename &&
      version.file.declaredMimeType === reserved.declaredMimeType &&
      version.file.expectedSizeBytes === reserved.expectedSizeBytes &&
      version.file.storage.path === reservation.signedUpload.path,
    `${path}.file`,
    'the reserved file metadata and backend-issued Storage path',
  );
}

function assertFinalizedDraft(
  version: AdminOperationalStoredVersion,
  path: string,
): void {
  assertEdgeContract(
    version.status === 'ready' &&
      version.targets.length === 0 &&
      version.statements.length === 0 &&
      Object.values(version.assignmentSummary).every((count) => count === 0),
    path,
    'an unconfigured ready version with zero assignments',
  );
}

function sameTimestamp(left: string | null, right: string | null): boolean {
  return left === null || right === null
    ? left === right
    : Date.parse(left) === Date.parse(right);
}
