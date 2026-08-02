import type { CoworkerDocumentOrigin } from "../coworker-document-edge/coworker-document-models.ts";
import { createContractReaders } from "../coworker-document-edge/contract-readers.ts";

export const RETENTION_CLEANUP_RPC = {
  claim: "claim_coworker_document_retention_cleanup",
  claimForDocument: "claim_coworker_document_retention_cleanup_for_document",
  recordResult: "record_coworker_document_retention_cleanup_result",
  getReport: "get_coworker_document_retention_cleanup_report",
} as const;

export const RETENTION_CLEANUP_CANDIDATE_REASONS = [
  "unprotected_superseded",
] as const;

export const RETENTION_CLEANUP_DEAD_LETTER_FAILURE_CODES = [
  "protection_added_after_storage_delete",
  "eligibility_changed_after_storage_delete",
] as const;

export const RETENTION_CLEANUP_SUMMARY_KEYS = [
  "pending",
  "processing",
  "failed",
  "completed",
  "skipped",
] as const;

export const RETENTION_CLEANUP_BUCKET = "coworker-documents" as const;

export type RetentionCleanupRpcName =
  typeof RETENTION_CLEANUP_RPC[keyof typeof RETENTION_CLEANUP_RPC];

export class RetentionCleanupRequestContractError extends Error {
  constructor(readonly fieldErrors: Record<string, string>) {
    super("Retention cleanup request validation failed.");
    this.name = "RetentionCleanupRequestContractError";
  }
}

export class RetentionCleanupBackendContractError extends Error {
  constructor(readonly rpcName: RetentionCleanupRpcName) {
    super("Retention cleanup backend contract validation failed.");
    this.name = "RetentionCleanupBackendContractError";
  }
}

export const retentionCleanupReaders = createContractReaders<
  RetentionCleanupRpcName
>({
  createRequestError: (fieldErrors) =>
    new RetentionCleanupRequestContractError(fieldErrors),
  createBackendError: (rpcName) =>
    new RetentionCleanupBackendContractError(rpcName),
  allowEmptyBackendNullableString: false,
});

export interface RetentionCleanupRequest {
  limit: number;
  documentId: string | null;
}

export type RetentionCleanupSource =
  | "document_upload_finalized"
  | "questionnaire_document_finalized"
  | "document_version_deletion_requested"
  | "document_deletion_requested"
  | "document_version_preservation_changed";

export interface RetentionCleanupClaim {
  jobId: string;
  claimToken: string;
  claimExpiresAt: string;
  attemptCount: number;
  documentVersionId: string;
  documentId: string;
  userId: string;
  origin: CoworkerDocumentOrigin;
  candidateReason: typeof RETENTION_CLEANUP_CANDIDATE_REASONS[number];
  versionNumber: number;
  recordedSizeBytes: number | null;
  bucket: typeof RETENTION_CLEANUP_BUCKET;
  path: string;
}

export interface RetentionCleanupWorkerItemResult {
  jobId: string;
  documentVersionId: string;
  outcome:
    | "completed"
    | "failed"
    | "skipped"
    | "dead_letter"
    | "worker_error";
  attemptCount: number;
  failureCode: string | null;
  retryAfter: string | null;
  versionRowDeleted: boolean | null;
  idempotent: boolean | null;
}

export interface RetentionCleanupReportFailedJob {
  jobId: string;
  documentVersionId: string;
  documentId: string;
  origin: CoworkerDocumentOrigin;
  candidateReason: typeof RETENTION_CLEANUP_CANDIDATE_REASONS[number];
  attemptCount: number;
  nextAttemptAt: string;
  failureCode: string;
  bucket: typeof RETENTION_CLEANUP_BUCKET;
  path: string;
}

export interface RetentionCleanupReport {
  summary: Record<string, number>;
  completedVersionCount: number;
  completedRecordedBytes: number;
  readyToRetry: number;
  deadLetterCount: number;
  failedJobs: RetentionCleanupReportFailedJob[];
}

export interface RetentionCleanupWorkerResponse {
  ok: true;
  requestId: string;
  claimed: number;
  completed: number;
  failed: number;
  skipped: number;
  deadLetter: number;
  workerErrors: number;
  results: RetentionCleanupWorkerItemResult[];
  report: RetentionCleanupReport;
}

export function parseRetentionCleanupRequest(
  value: unknown,
): RetentionCleanupRequest {
  const errors: Record<string, string> = {};
  const source = retentionCleanupReaders.requestObject(value, "", errors);
  retentionCleanupReaders.assertOnlyKeys(
    source,
    ["limit", "documentId"],
    "",
    errors,
  );
  return retentionCleanupReaders.validated({
    limit: retentionCleanupReaders.requestInteger(
      source,
      "limit",
      "limit",
      1,
      100,
      errors,
    ),
    documentId: retentionCleanupReaders.requestNullableUuid(
      source,
      "documentId",
      "documentId",
      errors,
    ),
  }, errors);
}
