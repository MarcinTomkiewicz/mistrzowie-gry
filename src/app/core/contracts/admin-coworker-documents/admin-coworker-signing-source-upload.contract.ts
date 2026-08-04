import {
  IAdminCoworkerSigningSourceRecoveredUpload,
  IAdminCoworkerSigningSourceUploadCancellation,
  IAdminCoworkerSigningSourceUploadFinalization,
  IAdminCoworkerSigningSourceUploadReservation,
} from '../../interfaces/i-admin-coworker-signing-source';
import {
  ADMIN_COWORKER_SIGNING_SOURCE_ACTION,
  AdminCoworkerSigningSourceUploadPayload,
} from '../../types/admin-coworker-signing-source';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  readEdgeBoolean,
  readEdgeNonBlankString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import {
  assertSigningSourceSignedUpload,
  signingSourceSignedUploadReader,
} from './admin-coworker-signing-source-readers';

export function createReserveSigningSourceUploadReader(
  request: AdminCoworkerSigningSourceUploadPayload,
): EdgeReader<IAdminCoworkerSigningSourceUploadReservation> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.reserveUpload,
      ] as const),
      upload: createStrictEdgeObjectReader({
        sourceId: readEdgeUuid,
        sourceCreated: readEdgeBoolean,
        sourceVersionId: readEdgeUuid,
        versionNumber: readEdgePositiveInteger,
        uploadSessionId: readEdgeUuid,
        originalFilename: readEdgeNonBlankString,
        storedFilename: readEdgeNonBlankString,
        declaredMimeType: readEdgeNonBlankString,
        expectedSizeBytes: readEdgePositiveInteger,
      }),
      signedUpload: signingSourceSignedUploadReader,
    })(value, path);
    const upload = response.upload;

    assertEdgeContract(
      (request.sourceId === null || upload.sourceId === request.sourceId) &&
        (request.sourceId === null || !upload.sourceCreated) &&
        upload.originalFilename === request.originalFilename &&
        upload.declaredMimeType === request.declaredMimeType &&
        upload.expectedSizeBytes === request.sizeBytes,
      `${path}.upload`,
      'the requested source target and upload metadata',
    );
    assertSigningSourceSignedUpload(response.signedUpload, `${path}.signedUpload`);
    return { upload, signedUpload: response.signedUpload };
  };
}

export function createRecoverSigningSourceUploadReader(
  uploadSessionId: string,
): EdgeReader<IAdminCoworkerSigningSourceRecoveredUpload> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.recoverUpload,
      ] as const),
      upload: createStrictEdgeObjectReader({
        sourceId: readEdgeUuid,
        sourceVersionId: readEdgeUuid,
        uploadSessionId: readEdgeUuid,
        expectedSizeBytes: readEdgePositiveInteger,
        expectedMimeType: readEdgeNonBlankString,
      }),
      signedUpload: signingSourceSignedUploadReader,
    })(value, path);

    assertEdgeContract(
      response.upload.uploadSessionId === uploadSessionId,
      `${path}.upload.uploadSessionId`,
      `the requested upload session id ${uploadSessionId}`,
    );
    assertSigningSourceSignedUpload(response.signedUpload, `${path}.signedUpload`);
    return { upload: response.upload, signedUpload: response.signedUpload };
  };
}

export function createFinalizeSigningSourceUploadReader(
  uploadSessionId: string,
): EdgeReader<IAdminCoworkerSigningSourceUploadFinalization> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.finalizeUpload,
      ] as const),
      result: createStrictEdgeObjectReader({
        sourceId: readEdgeUuid,
        sourceVersionId: readEdgeUuid,
        versionNumber: readEdgePositiveInteger,
        uploadSessionId: readEdgeUuid,
        sourceVersionStatus: createEdgeLiteralReader(['ready'] as const),
        detectedMimeType: readEdgeNonBlankString,
        sizeBytes: readEdgePositiveInteger,
        finalizedAt: readEdgeTimestamp,
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

export function createCancelSigningSourceUploadReader(
  uploadSessionId: string,
): EdgeReader<IAdminCoworkerSigningSourceUploadCancellation> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.cancelUpload,
      ] as const),
      uploadSessionId: readEdgeUuid,
      cancelled: createEdgeLiteralReader([true] as const),
      cleanupStatus: createEdgeLiteralReader(['completed'] as const),
      cleanupCompletedAt: readEdgeNullableTimestamp,
    })(value, path);

    assertEdgeContract(
      response.uploadSessionId === uploadSessionId,
      `${path}.uploadSessionId`,
      `the requested upload session id ${uploadSessionId}`,
    );
    return response;
  };
}
