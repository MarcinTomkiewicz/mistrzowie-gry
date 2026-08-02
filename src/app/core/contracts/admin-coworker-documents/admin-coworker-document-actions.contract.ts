import {
  IAdminCoworkerVersionDownload,
  IAdminSignatureVerification,
} from '../../interfaces/i-admin-coworker-document';
import { ICoworkerDocument } from '../../interfaces/i-coworker-document';
import {
  ADMIN_COWORKER_DOCUMENT_ACTION,
  ADMIN_COWORKER_DOWNLOAD_PURPOSES,
  ADMIN_SIGNATURE_VERIFICATION_STATUSES,
  AdminCoworkerDownloadPurpose,
  AdminSignatureVerificationStatus,
} from '../../types/admin-coworker-document';
import {
  COWORKER_SIGNATURE_VERIFICATION_METHODS,
  COWORKER_VERIFIED_SIGNATURE_TYPES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeNullableString,
  readEdgeNonBlankString,
  readEdgeObject,
  readEdgePositiveInteger,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import {
  coworkerDocumentReader,
} from '../coworker-documents/coworker-document-readers';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);

export function createAdminDocumentMutationReader(
  action:
    | typeof ADMIN_COWORKER_DOCUMENT_ACTION.startReview
    | typeof ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument
    | typeof ADMIN_COWORKER_DOCUMENT_ACTION.rejectDocument,
  userId: string,
  documentId: string,
): EdgeReader<ICoworkerDocument> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([action] as const),
      document: coworkerDocumentReader,
    })(value, path);
    const expectedStatus = action === ADMIN_COWORKER_DOCUMENT_ACTION.startReview
      ? 'under_review'
      : action === ADMIN_COWORKER_DOCUMENT_ACTION.acceptDocument
      ? 'accepted'
      : 'rejected';
    assertEdgeContract(
      response.document.id === documentId &&
        response.document.userId === userId &&
        response.document.status === expectedStatus,
      `${path}.document`,
      `document ${documentId} for user ${userId} in status ${expectedStatus}`,
    );
    return response.document;
  };
}

export function createAdminSignatureVerificationReader(
  documentId: string,
  documentVersionId: string,
  verificationStatus: AdminSignatureVerificationStatus,
): EdgeReader<IAdminSignatureVerification> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_DOCUMENT_ACTION.verifySignature,
      ] as const),
      verification: createStrictEdgeObjectReader({
        id: readEdgeUuid,
        documentId: readEdgeUuid,
        documentVersionId: readEdgeUuid,
        verificationMethod: createEdgeLiteralReader(
          COWORKER_SIGNATURE_VERIFICATION_METHODS,
        ),
        verificationStatus: createEdgeLiteralReader(
          ADMIN_SIGNATURE_VERIFICATION_STATUSES,
        ),
        signatureType: createEdgeLiteralReader(
          COWORKER_VERIFIED_SIGNATURE_TYPES,
        ),
        actorUserId: nullableUuidReader,
        providerName: readEdgeNullableString,
        providerReference: readEdgeNullableString,
        reason: readEdgeNullableString,
        details: readEdgeObject,
        createdAt: readEdgeTimestamp,
      }),
    })(value, path);
    const verification = response.verification;
    assertEdgeContract(
      verification.documentId === documentId &&
        verification.documentVersionId === documentVersionId &&
        verification.verificationStatus === verificationStatus,
      `${path}.verification`,
      'the requested document, version and verification status',
    );
    return verification;
  };
}

export function createAdminDocumentDownloadReader(
  documentVersionId: string,
  purpose: AdminCoworkerDownloadPurpose,
): EdgeReader<IAdminCoworkerVersionDownload> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_DOCUMENT_ACTION.downloadDocumentVersion,
      ] as const),
      download: createStrictEdgeObjectReader({
        documentId: readEdgeUuid,
        documentVersionId: readEdgeUuid,
        signedUrl: readEdgeNonBlankString,
        expiresInSeconds: readEdgePositiveInteger,
        originalFilename: readEdgeString,
        mimeType: readEdgeString,
        sizeBytes: readEdgePositiveInteger,
        purpose: createEdgeLiteralReader(ADMIN_COWORKER_DOWNLOAD_PURPOSES),
      }),
    })(value, path);
    assertEdgeContract(
      response.download.documentVersionId === documentVersionId &&
        response.download.purpose === purpose,
      `${path}.download`,
      'the requested document version and download purpose',
    );
    return { download: response.download };
  };
}
