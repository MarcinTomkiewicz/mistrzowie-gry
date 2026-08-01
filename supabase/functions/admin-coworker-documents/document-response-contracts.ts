import { createCoworkerDocumentParser } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import type { CoworkerDocument } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";
import {
  adminDocumentReaders,
  type AdminDownloadPurpose,
  BackendContractError,
  type DownloadTarget,
  RPC,
  type VerificationStatus,
} from "./contracts.ts";
export { parseReviewDetail } from "./document-review-model-parser.ts";

const REVIEW_QUEUE_STATUSES = ["submitted", "under_review"] as const;
const DOWNLOAD_PURPOSES = ["admin_review", "admin_download"] as const;

const {
  backendArray,
  backendArrayValue,
  backendEnum,
  backendNullableString,
  backendNullableTimestamp,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = adminDocumentReaders;

const { parseCoworkerDocument } = createCoworkerDocumentParser(
  adminDocumentReaders,
  (rpcName) => new BackendContractError(rpcName),
);

export function parseAdminDashboard(
  catalogValue: unknown,
  queueValue: unknown,
): UnknownObject {
  const catalog = backendObject(catalogValue, RPC.getCatalog);
  backendArray(catalog, "signaturePolicies", RPC.getCatalog);
  backendArray(catalog, "documentDefinitions", RPC.getCatalog);
  const reviewQueue = backendArrayValue(queueValue, RPC.getReviewQueue).map(
    parseReviewQueueItem,
  );

  if (
    new Set(reviewQueue.map((item) => item.documentId)).size !==
      reviewQueue.length
  ) {
    throw new BackendContractError(RPC.getReviewQueue);
  }
  return { catalog, reviewQueue };
}

function parseReviewQueueItem(value: unknown) {
  const source = backendObject(value, RPC.getReviewQueue, [
    "userId",
    "displayName",
    "email",
    "documentId",
    "documentTitle",
    "documentDefinitionId",
    "documentDefinitionCode",
    "documentDefinitionTitle",
    "status",
    "submittedVersionId",
    "submittedAt",
    "reviewStartedAt",
    "revision",
    "updatedAt",
  ]);
  return {
    userId: backendUuid(source, "userId", RPC.getReviewQueue),
    displayName: backendString(source, "displayName", RPC.getReviewQueue),
    email: backendString(source, "email", RPC.getReviewQueue),
    documentId: backendUuid(source, "documentId", RPC.getReviewQueue),
    documentTitle: backendNullableString(
      source,
      "documentTitle",
      RPC.getReviewQueue,
    ),
    documentDefinitionId: backendUuid(
      source,
      "documentDefinitionId",
      RPC.getReviewQueue,
    ),
    documentDefinitionCode: backendString(
      source,
      "documentDefinitionCode",
      RPC.getReviewQueue,
    ),
    documentDefinitionTitle: backendString(
      source,
      "documentDefinitionTitle",
      RPC.getReviewQueue,
    ),
    status: backendEnum(
      source,
      "status",
      REVIEW_QUEUE_STATUSES,
      RPC.getReviewQueue,
    ),
    submittedVersionId: backendUuid(
      source,
      "submittedVersionId",
      RPC.getReviewQueue,
    ),
    submittedAt: backendTimestamp(source, "submittedAt", RPC.getReviewQueue),
    reviewStartedAt: backendNullableTimestamp(
      source,
      "reviewStartedAt",
      RPC.getReviewQueue,
    ),
    revision: backendPositiveInteger(source, "revision", RPC.getReviewQueue),
    updatedAt: backendTimestamp(source, "updatedAt", RPC.getReviewQueue),
  };
}

export function parseDocumentResult(
  value: unknown,
  rpcName:
    | typeof RPC.startReview
    | typeof RPC.acceptDocument
    | typeof RPC.rejectDocument,
  userId: string,
  documentId: string,
): CoworkerDocument {
  const document = parseCoworkerDocument(value, rpcName);
  const expectedStatus = rpcName === RPC.startReview
    ? "under_review"
    : rpcName === RPC.acceptDocument
    ? "accepted"
    : "rejected";
  if (
    document.id !== documentId ||
    document.userId !== userId ||
    document.status !== expectedStatus
  ) {
    throw new BackendContractError(rpcName);
  }
  return document;
}

export function parseSignatureVerification(
  value: unknown,
  userId: string,
  documentId: string,
  documentVersionId: string,
  expectedStatus: VerificationStatus,
): UnknownObject {
  const verification = backendObject(value, RPC.verifySignature);

  if (
    backendUuid(verification, "documentId", RPC.verifySignature) !==
      documentId ||
    backendUuid(
        verification,
        "documentVersionId",
        RPC.verifySignature,
      ) !== documentVersionId ||
    backendString(
        verification,
        "verificationStatus",
        RPC.verifySignature,
      ) !== expectedStatus ||
    userId === ""
  ) {
    throw new BackendContractError(RPC.verifySignature);
  }

  backendUuid(verification, "id", RPC.verifySignature);
  backendTimestamp(verification, "createdAt", RPC.verifySignature);
  return verification;
}

export function parseDownloadTarget(
  value: unknown,
  documentVersionId: string,
  purpose: AdminDownloadPurpose,
): DownloadTarget {
  const result = backendObject(value, RPC.getDownloadTarget, [
    "documentId",
    "documentVersionId",
    "bucket",
    "path",
    "originalFilename",
    "mimeType",
    "sizeBytes",
    "purpose",
    "signedUrlExpiresInSeconds",
  ]);
  const target: DownloadTarget = {
    documentId: backendUuid(result, "documentId", RPC.getDownloadTarget),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.getDownloadTarget,
    ),
    bucket: backendString(result, "bucket", RPC.getDownloadTarget),
    path: backendString(result, "path", RPC.getDownloadTarget),
    originalFilename: backendString(
      result,
      "originalFilename",
      RPC.getDownloadTarget,
    ),
    mimeType: backendString(result, "mimeType", RPC.getDownloadTarget),
    sizeBytes: backendPositiveInteger(
      result,
      "sizeBytes",
      RPC.getDownloadTarget,
    ),
    purpose: backendEnum(
      result,
      "purpose",
      DOWNLOAD_PURPOSES,
      RPC.getDownloadTarget,
    ),
    signedUrlExpiresInSeconds: backendPositiveInteger(
      result,
      "signedUrlExpiresInSeconds",
      RPC.getDownloadTarget,
    ),
  };

  if (
    target.documentVersionId !== documentVersionId ||
    target.purpose !== purpose ||
    target.bucket !== "coworker-documents" ||
    target.signedUrlExpiresInSeconds > 300
  ) {
    throw new BackendContractError(RPC.getDownloadTarget);
  }
  return target;
}
