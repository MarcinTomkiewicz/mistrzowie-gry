import {
  IAdminCoworkerSigningSourceDownload,
  IAdminCoworkerSigningSourcePublishResult,
} from '../../interfaces/i-admin-coworker-signing-source';
import { ADMIN_COWORKER_SIGNING_SOURCE_ACTION } from '../../types/admin-coworker-signing-source';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  readEdgeBoolean,
  readEdgeNonBlankString,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import {
  nullableSigningSourceUuidReader,
  readSigningSourceUrl,
  signingSourceCodeReader,
} from './admin-coworker-signing-source-readers';

export function createPublishSigningSourceVersionReader(
  sourceVersionId: string,
): EdgeReader<IAdminCoworkerSigningSourcePublishResult> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.publishVersion,
      ] as const),
      result: createStrictEdgeObjectReader({
        sourceId: readEdgeUuid,
        sourceVersionId: readEdgeUuid,
        sourceCode: signingSourceCodeReader,
        versionNumber: readEdgePositiveInteger,
        status: createEdgeLiteralReader(['published'] as const),
        publishedAt: readEdgeTimestamp,
        supersededVersionId: nullableSigningSourceUuidReader,
        idempotent: readEdgeBoolean,
      }),
    })(value, path);

    assertEdgeContract(
      response.result.sourceVersionId === sourceVersionId &&
        response.result.supersededVersionId !== sourceVersionId,
      `${path}.result`,
      'the requested source version identity',
    );
    return response.result;
  };
}

export function createDownloadSigningSourceVersionReader(
  sourceVersionId: string,
): EdgeReader<IAdminCoworkerSigningSourceDownload> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_SIGNING_SOURCE_ACTION.downloadVersion,
      ] as const),
      download: createStrictEdgeObjectReader({
        sourceId: readEdgeUuid,
        sourceVersionId: readEdgeUuid,
        sourceCode: signingSourceCodeReader,
        signedUrl: readSigningSourceUrl,
        expiresInSeconds: readEdgePositiveInteger,
        originalFilename: readEdgeNonBlankString,
        mimeType: readEdgeNonBlankString,
        sizeBytes: readEdgePositiveInteger,
      }),
    })(value, path);

    assertEdgeContract(
      response.download.sourceVersionId === sourceVersionId &&
        response.download.expiresInSeconds <= 300,
      `${path}.download`,
      'the requested version and a maximum five-minute download URL',
    );
    return response.download;
  };
}
