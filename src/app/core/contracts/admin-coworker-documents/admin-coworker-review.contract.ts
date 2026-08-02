import {
  IAdminCoworkerDocumentReviewDetail,
  IAdminCoworkerReviewDocument,
  IAdminCoworkerReviewRequirement,
} from '../../interfaces/i-admin-coworker-document';
import { ICoworkerDocumentVersion } from '../../interfaces/i-coworker-document';
import { ADMIN_COWORKER_DOCUMENT_ACTION } from '../../types/admin-coworker-document';
import { APP_ROLES } from '../../types/app-role';
import {
  COWORKER_DOCUMENT_ORIGINS,
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
  COWORKER_DOCUMENT_STATUSES,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeBoolean,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import {
  coworkerDocumentDefinitionReader,
  createCoworkerDocumentVersionReader,
} from '../coworker-documents/coworker-document-readers';
import {
  adminDocumentReviewHistoryReader,
  adminSignatureVerificationHistoryReader,
} from './admin-coworker-review-history.contract';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const statusesRequiringSubmittedVersion = new Set([
  'submitted',
  'under_review',
  'accepted',
  'rejected',
]);

const reviewRequirementReader: EdgeReader<IAdminCoworkerReviewRequirement> =
  createStrictEdgeObjectReader({
    id: readEdgeUuid,
    onboardingCaseId: nullableUuidReader,
    status: createEdgeLiteralReader(COWORKER_DOCUMENT_REQUIREMENT_STATUSES),
    required: readEdgeBoolean,
    dueAt: readEdgeNullableTimestamp,
    fulfilledByDocumentId: nullableUuidReader,
    fulfilledAt: readEdgeNullableTimestamp,
    waivedAt: readEdgeNullableTimestamp,
    waiverReason: readEdgeNullableString,
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

const reviewDocumentReader: EdgeReader<IAdminCoworkerReviewDocument> =
  createStrictEdgeObjectReader({
    id: readEdgeUuid,
    userId: readEdgeUuid,
    onboardingCaseId: nullableUuidReader,
    requirementId: nullableUuidReader,
    documentDefinitionId: readEdgeUuid,
    title: readEdgeNullableString,
    origin: createEdgeLiteralReader(COWORKER_DOCUMENT_ORIGINS),
    status: createEdgeLiteralReader(COWORKER_DOCUMENT_STATUSES),
    currentVersionId: nullableUuidReader,
    submittedVersionId: nullableUuidReader,
    submittedAt: readEdgeNullableTimestamp,
    reviewStartedAt: readEdgeNullableTimestamp,
    acceptedAt: readEdgeNullableTimestamp,
    rejectedAt: readEdgeNullableTimestamp,
    rejectionReason: readEdgeNullableString,
    withdrawnAt: readEdgeNullableTimestamp,
    archivedAt: readEdgeNullableTimestamp,
    revision: readEdgePositiveInteger,
    createdAt: readEdgeTimestamp,
    updatedAt: readEdgeTimestamp,
  });

export function createAdminCoworkerReviewDetailReader(
  userId: string,
  documentId: string,
): EdgeReader<IAdminCoworkerDocumentReviewDetail> {
  return (value, path) => {
    const outer = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        ADMIN_COWORKER_DOCUMENT_ACTION.getReviewDetail,
      ] as const),
      detail: createStrictEdgeObjectReader({
        user: createStrictEdgeObjectReader({
          userId: readEdgeUuid,
          email: readEdgeString,
          firstName: readEdgeNullableString,
          appRole: createEdgeLiteralReader(APP_ROLES),
        }),
        documentDefinition: coworkerDocumentDefinitionReader,
        requirement: createEdgeNullableReader(reviewRequirementReader),
        document: reviewDocumentReader,
        submittedVersion: createEdgeNullableReader(
          createCoworkerDocumentVersionReader(documentId),
        ),
        currentVersion: createEdgeNullableReader(
          createCoworkerDocumentVersionReader(documentId),
        ),
        versions: createEdgeArrayReader(
          createCoworkerDocumentVersionReader(documentId),
        ),
        signatureVerifications: createEdgeArrayReader(
          adminSignatureVerificationHistoryReader,
        ),
        reviews: createEdgeArrayReader(adminDocumentReviewHistoryReader),
      }),
    })(value, path);

    assertReviewDetail(outer.detail, userId, documentId, `${path}.detail`);
    return outer.detail;
  };
}

function assertReviewDetail(
  detail: IAdminCoworkerDocumentReviewDetail,
  userId: string,
  documentId: string,
  path: string,
): void {
  const { document, currentVersion, submittedVersion, versions } = detail;
  const versionIds = new Set(versions.map((version) => version.id));
  const verificationById = new Map(
    detail.signatureVerifications.map((verification) => [
      verification.id,
      verification,
    ]),
  );

  assertEdgeContract(
    detail.user.userId === userId &&
      document.id === documentId &&
      document.userId === userId &&
      document.documentDefinitionId === detail.documentDefinition.id &&
      (document.requirementId === null) === (detail.requirement === null) &&
      (detail.requirement === null ||
        detail.requirement.id === document.requirementId) &&
      (document.currentVersionId === null) === (currentVersion === null) &&
      (currentVersion === null || currentVersion.id === document.currentVersionId) &&
      (document.submittedVersionId === null) === (submittedVersion === null) &&
      (submittedVersion === null ||
        submittedVersion.id === document.submittedVersionId) &&
      (document.currentVersionId === null ||
        versionIds.has(document.currentVersionId)) &&
      (document.submittedVersionId === null ||
        versionIds.has(document.submittedVersionId)) &&
      (!statusesRequiringSubmittedVersion.has(document.status) ||
        submittedVersion !== null) &&
      versionIds.size === versions.length &&
      new Set(versions.map((version) => version.versionNumber)).size ===
        versions.length &&
      verificationById.size === detail.signatureVerifications.length &&
      new Set(detail.reviews.map((review) => review.id)).size ===
        detail.reviews.length &&
      detail.signatureVerifications.every((verification) =>
        versionIds.has(verification.documentVersionId)
      ) &&
      detail.reviews.every((review) =>
        isValidReviewReference(review, versionIds, verificationById)
      ) &&
      versions.every((version) =>
        isValidLatestVerification(version, verificationById)
      ),
    path,
    'consistent identities, unique versions and valid review/verification references',
  );
}

function isValidReviewReference(
  review: IAdminCoworkerDocumentReviewDetail['reviews'][number],
  versionIds: ReadonlySet<string>,
  verificationById: ReadonlyMap<
    string,
    IAdminCoworkerDocumentReviewDetail['signatureVerifications'][number]
  >,
): boolean {
  const verification = review.signatureVerificationId === null
    ? null
    : verificationById.get(review.signatureVerificationId);
  return versionIds.has(review.documentVersionId) &&
    (review.signatureVerificationId === null ||
      verification?.documentVersionId === review.documentVersionId);
}

function isValidLatestVerification(
  version: ICoworkerDocumentVersion,
  verificationById: ReadonlyMap<
    string,
    IAdminCoworkerDocumentReviewDetail['signatureVerifications'][number]
  >,
): boolean {
  const latest = version.latestSignatureVerification;
  return latest === null ||
    verificationById.get(latest.id)?.documentVersionId === version.id;
}
