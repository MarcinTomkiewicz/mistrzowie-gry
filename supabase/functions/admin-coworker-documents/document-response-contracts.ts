import { createCoworkerDocumentDefinitionParser } from "../_shared/coworker-document-edge/coworker-document-definition-parser.ts";
import {
  COWORKER_DOCUMENT_VERIFICATION_METHODS,
  COWORKER_DOCUMENT_VERIFICATION_STATUSES,
  COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES,
  type CoworkerDocumentDefinition,
  type CoworkerSignaturePolicy,
} from "../_shared/coworker-document-edge/coworker-document-models.ts";
import { createCoworkerDocumentParser } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import type { CoworkerDocument } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import {
  adminDocumentReaders,
  BackendContractError,
  RPC,
  type VerificationStatus,
} from "./contracts.ts";
export { parseReviewDetail } from "./document-review-model-parser.ts";

const REVIEW_QUEUE_STATUSES = ["submitted", "under_review"] as const;
const {
  backendArray,
  backendArrayValue,
  backendEnum,
  backendNullableString,
  backendNullableTimestamp,
  backendNullableUuid,
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
const {
  parseCoworkerDocumentDefinition,
  parseCoworkerSignaturePolicy,
} = createCoworkerDocumentDefinitionParser(adminDocumentReaders);

export interface AdminDocumentCatalog {
  signaturePolicies: CoworkerSignaturePolicy[];
  documentDefinitions: CoworkerDocumentDefinition[];
}

export interface AdminDocumentDashboard {
  catalog: AdminDocumentCatalog;
  reviewQueue: ReturnType<typeof parseReviewQueueItem>[];
}

export interface AdminSignatureVerification {
  id: string;
  documentId: string;
  documentVersionId: string;
  verificationMethod: typeof COWORKER_DOCUMENT_VERIFICATION_METHODS[number];
  verificationStatus: VerificationStatus;
  signatureType: typeof COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES[number];
  actorUserId: string | null;
  providerName: string | null;
  providerReference: string | null;
  reason: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export function parseAdminDashboard(
  catalogValue: unknown,
  queueValue: unknown,
): AdminDocumentDashboard {
  const source = backendObject(catalogValue, RPC.getCatalog, [
    "signaturePolicies",
    "documentDefinitions",
  ]);
  const catalog: AdminDocumentCatalog = {
    signaturePolicies: backendArray(
      source,
      "signaturePolicies",
      RPC.getCatalog,
    ).map((policy) => parseCoworkerSignaturePolicy(policy, RPC.getCatalog)),
    documentDefinitions: backendArray(
      source,
      "documentDefinitions",
      RPC.getCatalog,
    ).map((definition) =>
      parseCoworkerDocumentDefinition(definition, RPC.getCatalog)
    ),
  };
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
  documentId: string,
  documentVersionId: string,
  expectedStatus: VerificationStatus,
): AdminSignatureVerification {
  const verification = backendObject(value, RPC.verifySignature, [
    "id",
    "documentId",
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
  const parsedDocumentId = backendUuid(
    verification,
    "documentId",
    RPC.verifySignature,
  );
  const parsedDocumentVersionId = backendUuid(
    verification,
    "documentVersionId",
    RPC.verifySignature,
  );
  const verificationStatus = backendEnum(
    verification,
    "verificationStatus",
    COWORKER_DOCUMENT_VERIFICATION_STATUSES,
    RPC.verifySignature,
  );

  if (
    parsedDocumentId !== documentId ||
    parsedDocumentVersionId !== documentVersionId ||
    verificationStatus !== expectedStatus
  ) {
    throw new BackendContractError(RPC.verifySignature);
  }

  return {
    id: backendUuid(verification, "id", RPC.verifySignature),
    documentId: parsedDocumentId,
    documentVersionId: parsedDocumentVersionId,
    verificationMethod: backendEnum(
      verification,
      "verificationMethod",
      COWORKER_DOCUMENT_VERIFICATION_METHODS,
      RPC.verifySignature,
    ),
    verificationStatus: expectedStatus,
    signatureType: backendEnum(
      verification,
      "signatureType",
      COWORKER_DOCUMENT_VERIFIED_SIGNATURE_TYPES,
      RPC.verifySignature,
    ),
    actorUserId: backendNullableUuid(
      verification,
      "actorUserId",
      RPC.verifySignature,
    ),
    providerName: backendNullableString(
      verification,
      "providerName",
      RPC.verifySignature,
    ),
    providerReference: backendNullableString(
      verification,
      "providerReference",
      RPC.verifySignature,
    ),
    reason: backendNullableString(
      verification,
      "reason",
      RPC.verifySignature,
    ),
    details: backendObject(verification.details, RPC.verifySignature),
    createdAt: backendTimestamp(
      verification,
      "createdAt",
      RPC.verifySignature,
    ),
  };
}
