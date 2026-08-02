import { createCoworkerDocumentDefinitionParser } from "../_shared/coworker-document-edge/coworker-document-definition-parser.ts";
import {
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
  COWORKER_DOCUMENT_STATUSES,
} from "../_shared/coworker-document-edge/coworker-document-models.ts";
import { createCoworkerDocumentParser } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import {
  type CoworkerDocumentNotification,
  type CoworkerDocumentPortalRequirement,
  type CoworkerDocumentPortalSource,
  type CoworkerDocumentPortalSubmission,
  RPC,
} from "./contracts.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
} from "./contract-context.ts";

const REQUIREMENT_KEYS = [
  "id",
  "onboardingCaseId",
  "status",
  "required",
  "dueAt",
  "fulfilledByDocumentId",
  "fulfilledAt",
  "waivedAt",
  "waiverReason",
  "documentDefinition",
  "sourceDocument",
  "submissionDocument",
  "createdAt",
  "updatedAt",
] as const;
const SOURCE_DOCUMENT_KEYS = [
  "id",
  "origin",
  "title",
  "status",
  "currentVersion",
  "historyCount",
] as const;
const SUBMISSION_DOCUMENT_KEYS = [
  "id",
  "origin",
  "title",
  "status",
  "currentVersion",
  "submittedVersionId",
  "historyCount",
] as const;
const NOTIFICATION_KEYS = [
  "id",
  "eventCode",
  "severity",
  "entityType",
  "entityId",
  "payload",
  "readAt",
  "createdAt",
] as const;
const SOURCE_DOCUMENT_ORIGINS = ["system_generated", "admin_upload"] as const;
const STATUSES_REQUIRING_SUBMITTED_VERSION = [
  "submitted",
  "under_review",
  "accepted",
  "rejected",
] as const;

const {
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendNonNegativeInteger,
  backendNullableString,
  backendNullableTimestamp,
  backendNullableUuid,
  backendObject,
  backendString,
  backendTimestamp,
  backendUuid,
} = coworkerDocumentReaders;
const { parseCoworkerDocumentVersion } = createCoworkerDocumentParser(
  coworkerDocumentReaders,
  (rpcName) => new BackendContractError(rpcName),
);
const { parseCoworkerDocumentDefinition } =
  createCoworkerDocumentDefinitionParser(coworkerDocumentReaders);

export function parsePortalRequirement(
  value: unknown,
): CoworkerDocumentPortalRequirement {
  const result = backendObject(value, RPC.getPortal, REQUIREMENT_KEYS);
  const status = backendEnum(
    result,
    "status",
    COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
    RPC.getPortal,
  );
  const fulfilledByDocumentId = backendNullableUuid(
    result,
    "fulfilledByDocumentId",
    RPC.getPortal,
  );
  const fulfilledAt = backendNullableTimestamp(
    result,
    "fulfilledAt",
    RPC.getPortal,
  );
  const waivedAt = backendNullableTimestamp(result, "waivedAt", RPC.getPortal);
  const waiverReason = backendNullableString(
    result,
    "waiverReason",
    RPC.getPortal,
  );
  const sourceDocument = result.sourceDocument === null
    ? null
    : parseSourceDocument(result.sourceDocument);
  const submissionDocument = result.submissionDocument === null
    ? null
    : parseSubmissionDocument(result.submissionDocument);
  const requirement: CoworkerDocumentPortalRequirement = {
    id: backendUuid(result, "id", RPC.getPortal),
    onboardingCaseId: backendNullableUuid(
      result,
      "onboardingCaseId",
      RPC.getPortal,
    ),
    status,
    required: backendBoolean(result, "required", RPC.getPortal),
    dueAt: backendNullableTimestamp(result, "dueAt", RPC.getPortal),
    fulfilledByDocumentId,
    fulfilledAt,
    waivedAt,
    waiverReason,
    documentDefinition: parseCoworkerDocumentDefinition(
      result.documentDefinition,
      RPC.getPortal,
    ),
    sourceDocument,
    submissionDocument,
    createdAt: backendTimestamp(result, "createdAt", RPC.getPortal),
    updatedAt: backendTimestamp(result, "updatedAt", RPC.getPortal),
  };

  if (
    (sourceDocument !== null && submissionDocument !== null &&
      sourceDocument.id === submissionDocument.id) ||
    (fulfilledByDocumentId !== null &&
      fulfilledByDocumentId !== submissionDocument?.id) ||
    (status === "fulfilled" &&
      (submissionDocument === null ||
        fulfilledByDocumentId === null ||
        fulfilledAt === null)) ||
    (status === "waived" && (waivedAt === null || waiverReason === null))
  ) {
    throw new BackendContractError(RPC.getPortal);
  }
  return requirement;
}

function parseSourceDocument(value: unknown): CoworkerDocumentPortalSource {
  const result = backendObject(value, RPC.getPortal, SOURCE_DOCUMENT_KEYS);
  const documentId = backendUuid(result, "id", RPC.getPortal);
  return {
    id: documentId,
    origin: backendEnum(
      result,
      "origin",
      SOURCE_DOCUMENT_ORIGINS,
      RPC.getPortal,
    ),
    title: backendNullableString(result, "title", RPC.getPortal),
    status: backendEnum(
      result,
      "status",
      COWORKER_DOCUMENT_STATUSES,
      RPC.getPortal,
    ),
    currentVersion: result.currentVersion === null
      ? null
      : parseCoworkerDocumentVersion(
        result.currentVersion,
        documentId,
        RPC.getPortal,
      ),
    historyCount: backendNonNegativeInteger(
      result,
      "historyCount",
      RPC.getPortal,
    ),
  };
}

function parseSubmissionDocument(
  value: unknown,
): CoworkerDocumentPortalSubmission {
  const result = backendObject(value, RPC.getPortal, SUBMISSION_DOCUMENT_KEYS);
  const documentId = backendUuid(result, "id", RPC.getPortal);
  const status = backendEnum(
    result,
    "status",
    COWORKER_DOCUMENT_STATUSES,
    RPC.getPortal,
  );
  const submittedVersionId = backendNullableUuid(
    result,
    "submittedVersionId",
    RPC.getPortal,
  );
  const submission: CoworkerDocumentPortalSubmission = {
    id: documentId,
    origin: backendLiteral(
      result,
      "origin",
      "coworker_upload",
      RPC.getPortal,
    ),
    title: backendNullableString(result, "title", RPC.getPortal),
    status,
    currentVersion: result.currentVersion === null
      ? null
      : parseCoworkerDocumentVersion(
        result.currentVersion,
        documentId,
        RPC.getPortal,
      ),
    submittedVersionId,
    historyCount: backendNonNegativeInteger(
      result,
      "historyCount",
      RPC.getPortal,
    ),
  };

  if (
    STATUSES_REQUIRING_SUBMITTED_VERSION.some(
      (requiredStatus) => requiredStatus === status,
    ) && submittedVersionId === null
  ) {
    throw new BackendContractError(RPC.getPortal);
  }
  return submission;
}

export function parsePortalNotification(
  value: unknown,
): CoworkerDocumentNotification {
  const result = backendObject(value, RPC.getPortal, NOTIFICATION_KEYS);
  return {
    id: backendUuid(result, "id", RPC.getPortal),
    eventCode: backendString(result, "eventCode", RPC.getPortal),
    severity: backendString(result, "severity", RPC.getPortal),
    entityType: backendString(result, "entityType", RPC.getPortal),
    entityId: backendNullableString(result, "entityId", RPC.getPortal),
    payload: backendObject(result.payload, RPC.getPortal),
    readAt: backendNullableTimestamp(result, "readAt", RPC.getPortal),
    createdAt: backendTimestamp(result, "createdAt", RPC.getPortal),
  };
}
