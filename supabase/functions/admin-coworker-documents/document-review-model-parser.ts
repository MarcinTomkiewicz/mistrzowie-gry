import { createCoworkerDocumentDefinitionParser } from "../_shared/coworker-document-edge/coworker-document-definition-parser.ts";
import { createCoworkerDocumentParser } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";
import {
  adminDocumentReaders,
  BackendContractError,
  RPC,
} from "./contracts.ts";
import {
  parseReviewHistoryItem,
  parseSignatureVerificationHistoryItem,
} from "./document-review-history-parser.ts";
import {
  parseReviewDocumentMetadata,
  parseReviewRequirement,
  parseReviewUser,
} from "./document-review-metadata-parser.ts";

const STATUSES_REQUIRING_SUBMITTED_VERSION = [
  "submitted",
  "under_review",
  "accepted",
  "rejected",
] as const;

const { backendArrayValue, backendObject } = adminDocumentReaders;

const { parseCoworkerDocumentVersion } = createCoworkerDocumentParser(
  adminDocumentReaders,
  (rpcName) => new BackendContractError(rpcName),
);
const { parseCoworkerDocumentDefinition } =
  createCoworkerDocumentDefinitionParser(adminDocumentReaders);

export function parseReviewDetail(
  value: unknown,
  userId: string,
  documentId: string,
): UnknownObject {
  const rpcName = RPC.getReviewDetail;
  const detail = backendObject(value, rpcName, [
    "user",
    "documentDefinition",
    "requirement",
    "document",
    "submittedVersion",
    "currentVersion",
    "versions",
    "signatureVerifications",
    "reviews",
  ]);
  const user = parseReviewUser(detail.user);
  const documentDefinition = parseCoworkerDocumentDefinition(
    detail.documentDefinition,
    rpcName,
  );
  const requirement = detail.requirement === null
    ? null
    : parseReviewRequirement(detail.requirement);
  const document = parseReviewDocumentMetadata(detail.document);
  const versions = backendArrayValue(detail.versions, rpcName).map((version) =>
    parseCoworkerDocumentVersion(version, document.id, rpcName)
  );
  const submittedVersion = detail.submittedVersion === null
    ? null
    : parseCoworkerDocumentVersion(
      detail.submittedVersion,
      document.id,
      rpcName,
    );
  const currentVersion = detail.currentVersion === null
    ? null
    : parseCoworkerDocumentVersion(
      detail.currentVersion,
      document.id,
      rpcName,
    );
  const signatureVerifications = backendArrayValue(
    detail.signatureVerifications,
    rpcName,
  ).map(parseSignatureVerificationHistoryItem);
  const reviews = backendArrayValue(detail.reviews, rpcName).map(
    parseReviewHistoryItem,
  );
  const versionIds = new Set(versions.map((version) => version.id));
  const signatureVerificationIds = new Set(
    signatureVerifications.map((verification) => verification.id),
  );

  if (
    user.userId !== userId ||
    document.id !== documentId ||
    document.userId !== userId ||
    (document.currentVersionId === null) !== (currentVersion === null) ||
    (currentVersion !== null &&
      currentVersion.id !== document.currentVersionId) ||
    (document.submittedVersionId === null) !== (submittedVersion === null) ||
    (submittedVersion !== null &&
      submittedVersion.id !== document.submittedVersionId) ||
    (document.currentVersionId !== null &&
      !versionIds.has(document.currentVersionId)) ||
    (document.submittedVersionId !== null &&
      !versionIds.has(document.submittedVersionId)) ||
    (STATUSES_REQUIRING_SUBMITTED_VERSION.some(
      (status) => status === document.status,
    ) && submittedVersion === null) ||
    versionIds.size !== versions.length ||
    signatureVerifications.some((verification) =>
      !versionIds.has(verification.documentVersionId)
    ) ||
    reviews.some((review) =>
      !versionIds.has(review.documentVersionId) ||
      (review.signatureVerificationId !== null &&
        !signatureVerificationIds.has(review.signatureVerificationId))
    )
  ) {
    throw new BackendContractError(rpcName);
  }

  return {
    user,
    documentDefinition,
    requirement,
    document,
    submittedVersion,
    currentVersion,
    versions,
    signatureVerifications,
    reviews,
  };
}
