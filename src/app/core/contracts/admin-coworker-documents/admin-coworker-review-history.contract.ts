import {
  IAdminCoworkerDocumentReviewHistoryItem,
  IAdminSignatureVerificationHistoryItem,
} from '../../interfaces/i-admin-coworker-document';
import {
  ADMIN_COWORKER_REVIEW_DECISIONS,
} from '../../types/admin-coworker-document';
import {
  COWORKER_SIGNATURE_VERIFICATION_METHODS,
  COWORKER_SIGNATURE_VERIFICATION_STATUSES,
  COWORKER_VERIFIED_SIGNATURE_TYPES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeNullableString,
  readEdgeObject,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);

export const adminSignatureVerificationHistoryReader:
  EdgeReader<IAdminSignatureVerificationHistoryItem> = (value, path) => {
    const verification = createStrictEdgeObjectReader({
      id: readEdgeUuid,
      documentVersionId: readEdgeUuid,
      verificationMethod: createEdgeLiteralReader(
        COWORKER_SIGNATURE_VERIFICATION_METHODS,
      ),
      verificationStatus: createEdgeLiteralReader(
        COWORKER_SIGNATURE_VERIFICATION_STATUSES,
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
    })(value, path);
    assertEdgeContract(
      verification.verificationMethod !== 'manual' ||
        verification.actorUserId !== null,
      `${path}.actorUserId`,
      'a UUID for a manual verification',
    );
    return verification;
  };

export const adminDocumentReviewHistoryReader:
  EdgeReader<IAdminCoworkerDocumentReviewHistoryItem> = (value, path) => {
    const review = createStrictEdgeObjectReader({
      id: readEdgeUuid,
      documentVersionId: readEdgeUuid,
      decision: createEdgeLiteralReader(ADMIN_COWORKER_REVIEW_DECISIONS),
      signatureVerificationId: nullableUuidReader,
      rejectionReason: readEdgeNullableString,
      note: readEdgeNullableString,
      reviewedBy: readEdgeUuid,
      reviewedAt: readEdgeTimestamp,
      createdAt: readEdgeTimestamp,
    })(value, path);
    assertEdgeContract(
      (review.decision === 'accepted' && review.rejectionReason === null) ||
        (review.decision === 'rejected' && review.rejectionReason !== null),
      `${path}.rejectionReason`,
      'null for acceptance and a reason for rejection',
    );
    return review;
  };
