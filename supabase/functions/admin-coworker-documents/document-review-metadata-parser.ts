import {
  COWORKER_DOCUMENT_ORIGINS,
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
  COWORKER_DOCUMENT_STATUSES,
} from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import { adminDocumentReaders, RPC } from "./contracts.ts";

const APP_ROLES = [
  "user",
  "gm",
  "marketing_manager",
  "customer_manager",
  "lead_coordinator",
  "admin",
] as const;

const {
  backendBoolean,
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

export function parseReviewUser(value: unknown) {
  const source = backendObject(value, RPC.getReviewDetail, [
    "userId",
    "email",
    "firstName",
    "appRole",
  ]);
  return {
    userId: backendUuid(source, "userId", RPC.getReviewDetail),
    email: backendString(source, "email", RPC.getReviewDetail),
    firstName: backendNullableString(source, "firstName", RPC.getReviewDetail),
    appRole: backendEnum(source, "appRole", APP_ROLES, RPC.getReviewDetail),
  };
}

export function parseReviewRequirement(value: unknown) {
  const source = backendObject(value, RPC.getReviewDetail, [
    "id",
    "onboardingCaseId",
    "status",
    "required",
    "dueAt",
    "fulfilledByDocumentId",
    "fulfilledAt",
    "waivedAt",
    "waiverReason",
    "createdAt",
    "updatedAt",
  ]);
  return {
    id: backendUuid(source, "id", RPC.getReviewDetail),
    onboardingCaseId: backendNullableUuid(
      source,
      "onboardingCaseId",
      RPC.getReviewDetail,
    ),
    status: backendEnum(
      source,
      "status",
      COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
      RPC.getReviewDetail,
    ),
    required: backendBoolean(source, "required", RPC.getReviewDetail),
    dueAt: backendNullableTimestamp(source, "dueAt", RPC.getReviewDetail),
    fulfilledByDocumentId: backendNullableUuid(
      source,
      "fulfilledByDocumentId",
      RPC.getReviewDetail,
    ),
    fulfilledAt: backendNullableTimestamp(
      source,
      "fulfilledAt",
      RPC.getReviewDetail,
    ),
    waivedAt: backendNullableTimestamp(source, "waivedAt", RPC.getReviewDetail),
    waiverReason: backendNullableString(
      source,
      "waiverReason",
      RPC.getReviewDetail,
    ),
    createdAt: backendTimestamp(source, "createdAt", RPC.getReviewDetail),
    updatedAt: backendTimestamp(source, "updatedAt", RPC.getReviewDetail),
  };
}

export function parseReviewDocumentMetadata(value: unknown) {
  const source = backendObject(value, RPC.getReviewDetail, [
    "id",
    "userId",
    "onboardingCaseId",
    "requirementId",
    "documentDefinitionId",
    "title",
    "origin",
    "status",
    "currentVersionId",
    "submittedVersionId",
    "submittedAt",
    "reviewStartedAt",
    "acceptedAt",
    "rejectedAt",
    "rejectionReason",
    "withdrawnAt",
    "archivedAt",
    "revision",
    "createdAt",
    "updatedAt",
  ]);
  return {
    id: backendUuid(source, "id", RPC.getReviewDetail),
    userId: backendUuid(source, "userId", RPC.getReviewDetail),
    onboardingCaseId: backendNullableUuid(
      source,
      "onboardingCaseId",
      RPC.getReviewDetail,
    ),
    requirementId: backendNullableUuid(
      source,
      "requirementId",
      RPC.getReviewDetail,
    ),
    documentDefinitionId: backendUuid(
      source,
      "documentDefinitionId",
      RPC.getReviewDetail,
    ),
    title: backendNullableString(source, "title", RPC.getReviewDetail),
    origin: backendEnum(
      source,
      "origin",
      COWORKER_DOCUMENT_ORIGINS,
      RPC.getReviewDetail,
    ),
    status: backendEnum(
      source,
      "status",
      COWORKER_DOCUMENT_STATUSES,
      RPC.getReviewDetail,
    ),
    currentVersionId: backendNullableUuid(
      source,
      "currentVersionId",
      RPC.getReviewDetail,
    ),
    submittedVersionId: backendNullableUuid(
      source,
      "submittedVersionId",
      RPC.getReviewDetail,
    ),
    submittedAt: backendNullableTimestamp(
      source,
      "submittedAt",
      RPC.getReviewDetail,
    ),
    reviewStartedAt: backendNullableTimestamp(
      source,
      "reviewStartedAt",
      RPC.getReviewDetail,
    ),
    acceptedAt: backendNullableTimestamp(
      source,
      "acceptedAt",
      RPC.getReviewDetail,
    ),
    rejectedAt: backendNullableTimestamp(
      source,
      "rejectedAt",
      RPC.getReviewDetail,
    ),
    rejectionReason: backendNullableString(
      source,
      "rejectionReason",
      RPC.getReviewDetail,
    ),
    withdrawnAt: backendNullableTimestamp(
      source,
      "withdrawnAt",
      RPC.getReviewDetail,
    ),
    archivedAt: backendNullableTimestamp(
      source,
      "archivedAt",
      RPC.getReviewDetail,
    ),
    revision: backendPositiveInteger(source, "revision", RPC.getReviewDetail),
    createdAt: backendTimestamp(source, "createdAt", RPC.getReviewDetail),
    updatedAt: backendTimestamp(source, "updatedAt", RPC.getReviewDetail),
  };
}
