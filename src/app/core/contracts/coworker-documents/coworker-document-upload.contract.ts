import {
  ICoworkerRecoveredUpload,
  ICoworkerUploadCancellationResult,
  ICoworkerUploadFinalizationResult,
  ICoworkerUploadReservation,
} from '../../interfaces/i-coworker-document-upload';
import {
  COWORKER_DOCUMENT_ACTION,
  COWORKER_SIGNATURE_DECLARATION_TYPES,
  CoworkerDocumentActionRequest,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  readEdgeNonBlankString,
  readEdgeNullableTimestamp,
  readEdgeObject,
  readEdgePositiveInteger,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import { coworkerDocumentReader } from './coworker-document-readers';

type ReserveRequest = Extract<
  CoworkerDocumentActionRequest,
  { action: typeof COWORKER_DOCUMENT_ACTION.reserveUpload }
>;

export function createReserveUploadReader(
  request: ReserveRequest,
): EdgeReader<ICoworkerUploadReservation> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        COWORKER_DOCUMENT_ACTION.reserveUpload,
      ] as const),
      upload: createStrictEdgeObjectReader({
        documentId: readEdgeUuid,
        documentCreated: (field, fieldPath) => {
          const expected = request.documentId === null;
          return createEdgeLiteralReader([expected] as const)(field, fieldPath);
        },
        documentVersionId: readEdgeUuid,
        versionNumber: readEdgePositiveInteger,
        uploadSessionId: readEdgeUuid,
        originalFilename: readEdgeString,
        storedFilename: readEdgeString,
        declaredMimeType: readEdgeString,
        expectedSizeBytes: readEdgePositiveInteger,
        signatureDeclarationType: createEdgeLiteralReader(
          COWORKER_SIGNATURE_DECLARATION_TYPES,
        ),
      }),
      signedUpload: createStrictEdgeObjectReader({
        path: readEdgeNonBlankString,
        token: readEdgeNonBlankString,
        signedUrl: readEdgeNonBlankString,
        expiresAt: readEdgeTimestamp,
      }),
    })(value, path);
    const upload = response.upload;

    assertEdgeContract(
      (request.documentId === null || upload.documentId === request.documentId) &&
        upload.originalFilename === request.originalFilename &&
        upload.declaredMimeType === request.declaredMimeType &&
        upload.expectedSizeBytes === request.sizeBytes &&
        upload.signatureDeclarationType === request.signatureDeclarationType,
      `${path}.upload`,
      'the requested document target and upload metadata',
    );
    return { upload, signedUpload: response.signedUpload };
  };
}

export function createRecoverUploadReader(
  uploadSessionId: string,
): EdgeReader<ICoworkerRecoveredUpload> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        COWORKER_DOCUMENT_ACTION.recoverUpload,
      ] as const),
      upload: createStrictEdgeObjectReader({
        documentId: readEdgeUuid,
        documentVersionId: readEdgeUuid,
        uploadSessionId: readEdgeUuid,
        expectedSizeBytes: readEdgePositiveInteger,
        expectedMimeType: readEdgeString,
      }),
      signedUpload: createStrictEdgeObjectReader({
        token: readEdgeNonBlankString,
        signedUrl: readEdgeNonBlankString,
        expiresAt: readEdgeTimestamp,
      }),
    })(value, path);

    assertEdgeContract(
      response.upload.uploadSessionId === uploadSessionId,
      `${path}.upload.uploadSessionId`,
      `the requested upload session id ${uploadSessionId}`,
    );
    return { upload: response.upload, signedUpload: response.signedUpload };
  };
}

export function createFinalizeUploadReader(
  uploadSessionId: string,
): EdgeReader<ICoworkerUploadFinalizationResult> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        COWORKER_DOCUMENT_ACTION.finalizeUpload,
      ] as const),
      result: createStrictEdgeObjectReader({
        uploadSessionId: readEdgeUuid,
        finalized: createEdgeLiteralReader([true] as const),
        document: coworkerDocumentReader,
      }),
    })(value, path);
    assertEdgeContract(
      response.result.uploadSessionId === uploadSessionId,
      `${path}.result.uploadSessionId`,
      `the requested upload session id ${uploadSessionId}`,
    );
    return response.result;
  };
}

export function createCancelUploadReader(
  uploadSessionId: string,
): EdgeReader<ICoworkerUploadCancellationResult> {
  return (value, path) => {
    const source = readEdgeObject(value, path);
    if (source['cleanupCompletedAt'] === undefined) {
      const response = cancelWithoutCleanupTimestampReader(source, path);
      assertCancelUploadSession(response.uploadSessionId, uploadSessionId, path);
      return {
        uploadSessionId: response.uploadSessionId,
        cancelled: response.cancelled,
        cleanupStatus: response.cleanupStatus,
      };
    }

    const response = cancelWithCleanupTimestampReader(source, path);
    assertCancelUploadSession(response.uploadSessionId, uploadSessionId, path);
    return {
      uploadSessionId: response.uploadSessionId,
      cancelled: response.cancelled,
      cleanupStatus: response.cleanupStatus,
      cleanupCompletedAt: response.cleanupCompletedAt,
    };
  };
}

function assertCancelUploadSession(
  actualUploadSessionId: string,
  expectedUploadSessionId: string,
  path: string,
): void {
  assertEdgeContract(
    actualUploadSessionId === expectedUploadSessionId,
    `${path}.uploadSessionId`,
    `the requested upload session id ${expectedUploadSessionId}`,
  );
}

const cancelBaseReaders = {
  ok: createEdgeLiteralReader([true] as const),
  action: createEdgeLiteralReader([
    COWORKER_DOCUMENT_ACTION.cancelUpload,
  ] as const),
  uploadSessionId: readEdgeUuid,
  cancelled: createEdgeLiteralReader([true] as const),
} as const;

const cancelWithoutCleanupTimestampReader = createStrictEdgeObjectReader({
  ...cancelBaseReaders,
  cleanupStatus: createEdgeLiteralReader(['completed'] as const),
});

const cancelWithCleanupTimestampReader = createStrictEdgeObjectReader({
  ...cancelBaseReaders,
  cleanupStatus: createEdgeLiteralReader(['completed', 'failed'] as const),
  cleanupCompletedAt: readEdgeNullableTimestamp,
});
