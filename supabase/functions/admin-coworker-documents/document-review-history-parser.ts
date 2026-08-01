import {
  COWORKER_DOCUMENT_VERIFICATION_METHODS,
  COWORKER_DOCUMENT_VERIFICATION_STATUSES,
  COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES,
} from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import {
  adminDocumentReaders,
  BackendContractError,
  RPC,
} from "./contracts.ts";

const REVIEW_DECISIONS = ["accepted", "rejected"] as const;

const {
  backendEnum,
  backendNullableString,
  backendNullableUuid,
  backendObject,
  backendTimestamp,
  backendUuid,
} = adminDocumentReaders;

export function parseSignatureVerificationHistoryItem(value: unknown) {
  const source = backendObject(value, RPC.getReviewDetail, [
    "id",
    "documentVersionId",
    "verificationMethod",
    "verificationStatus",
    "signatureType",
    "actorUserId",
    "providerName",
    "providerReference",
    "reason",
    "details",
    "createdAt",
  ]);
  const verificationMethod = backendEnum(
    source,
    "verificationMethod",
    COWORKER_DOCUMENT_VERIFICATION_METHODS,
    RPC.getReviewDetail,
  );
  const actorUserId = backendNullableUuid(
    source,
    "actorUserId",
    RPC.getReviewDetail,
  );
  if (verificationMethod === "manual" && actorUserId === null) {
    throw new BackendContractError(RPC.getReviewDetail);
  }
  return {
    id: backendUuid(source, "id", RPC.getReviewDetail),
    documentVersionId: backendUuid(
      source,
      "documentVersionId",
      RPC.getReviewDetail,
    ),
    verificationMethod,
    verificationStatus: backendEnum(
      source,
      "verificationStatus",
      COWORKER_DOCUMENT_VERIFICATION_STATUSES,
      RPC.getReviewDetail,
    ),
    signatureType: backendEnum(
      source,
      "signatureType",
      COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES,
      RPC.getReviewDetail,
    ),
    actorUserId,
    providerName: backendNullableString(
      source,
      "providerName",
      RPC.getReviewDetail,
    ),
    providerReference: backendNullableString(
      source,
      "providerReference",
      RPC.getReviewDetail,
    ),
    reason: backendNullableString(source, "reason", RPC.getReviewDetail),
    details: backendObject(source.details, RPC.getReviewDetail),
    createdAt: backendTimestamp(source, "createdAt", RPC.getReviewDetail),
  };
}

export function parseReviewHistoryItem(value: unknown) {
  const source = backendObject(value, RPC.getReviewDetail, [
    "id",
    "documentVersionId",
    "decision",
    "signatureVerificationId",
    "rejectionReason",
    "note",
    "reviewedBy",
    "reviewedAt",
    "createdAt",
  ]);
  const decision = backendEnum(
    source,
    "decision",
    REVIEW_DECISIONS,
    RPC.getReviewDetail,
  );
  const rejectionReason = backendNullableString(
    source,
    "rejectionReason",
    RPC.getReviewDetail,
  );
  if (
    (decision === "accepted" && rejectionReason !== null) ||
    (decision === "rejected" && rejectionReason === null)
  ) {
    throw new BackendContractError(RPC.getReviewDetail);
  }
  return {
    id: backendUuid(source, "id", RPC.getReviewDetail),
    documentVersionId: backendUuid(
      source,
      "documentVersionId",
      RPC.getReviewDetail,
    ),
    decision,
    signatureVerificationId: backendNullableUuid(
      source,
      "signatureVerificationId",
      RPC.getReviewDetail,
    ),
    rejectionReason,
    note: backendNullableString(source, "note", RPC.getReviewDetail),
    reviewedBy: backendUuid(source, "reviewedBy", RPC.getReviewDetail),
    reviewedAt: backendTimestamp(source, "reviewedAt", RPC.getReviewDetail),
    createdAt: backendTimestamp(source, "createdAt", RPC.getReviewDetail),
  };
}
