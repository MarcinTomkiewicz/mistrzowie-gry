import {
  COWORKER_DOCUMENT_ORIGINS,
  type CoworkerDocumentOrigin,
} from "../_shared/coworker-document-edge/coworker-document-models.ts";
import { createContractReaders } from "../_shared/coworker-document-edge/contract-readers.ts";

export const RETENTION_CLEANUP_RPC = {
  claim: "claim_coworker_document_retention_cleanup",
  recordResult: "record_coworker_document_retention_cleanup_result",
  getReport: "get_coworker_document_retention_cleanup_report",
} as const;

export const RETENTION_CLEANUP_CANDIDATE_REASONS = [
  "system_superseded",
  "upload_history_limit",
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

const REPORT_KEYS = [
  "summary",
  "completedVersionCount",
  "completedRecordedBytes",
  "readyToRetry",
  "deadLetterCount",
  "failedJobs",
] as const;

const FAILED_JOB_KEYS = [
  "jobId",
  "documentVersionId",
  "documentId",
  "origin",
  "candidateReason",
  "attemptCount",
  "nextAttemptAt",
  "failureCode",
  "bucket",
  "path",
] as const;

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
}

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
  retentionCleanupReaders.assertOnlyKeys(source, ["limit"], "", errors);
  return retentionCleanupReaders.validated({
    limit: retentionCleanupReaders.requestInteger(
      source,
      "limit",
      "limit",
      1,
      50,
      errors,
    ),
  }, errors);
}

export function parseRetentionCleanupReport(
  value: unknown,
): RetentionCleanupReport {
  const context = RETENTION_CLEANUP_RPC.getReport;
  const source = retentionCleanupReaders.backendObject(
    value,
    context,
    REPORT_KEYS,
  );
  return {
    summary: parseSummary(source.summary),
    completedVersionCount: retentionCleanupReaders.backendNonNegativeInteger(
      source,
      "completedVersionCount",
      context,
    ),
    completedRecordedBytes: retentionCleanupReaders.backendNonNegativeInteger(
      source,
      "completedRecordedBytes",
      context,
    ),
    readyToRetry: retentionCleanupReaders.backendNonNegativeInteger(
      source,
      "readyToRetry",
      context,
    ),
    deadLetterCount: retentionCleanupReaders.backendNonNegativeInteger(
      source,
      "deadLetterCount",
      context,
    ),
    failedJobs: retentionCleanupReaders.backendArray(
      source,
      "failedJobs",
      context,
    ).map(parseFailedJob),
  };
}

function parseFailedJob(value: unknown): RetentionCleanupReportFailedJob {
  const context = RETENTION_CLEANUP_RPC.getReport;
  const source = retentionCleanupReaders.backendObject(
    value,
    context,
    FAILED_JOB_KEYS,
  );
  return {
    jobId: retentionCleanupReaders.backendUuid(source, "jobId", context),
    documentVersionId: retentionCleanupReaders.backendUuid(
      source,
      "documentVersionId",
      context,
    ),
    documentId: retentionCleanupReaders.backendUuid(
      source,
      "documentId",
      context,
    ),
    origin: retentionCleanupReaders.backendEnum(
      source,
      "origin",
      COWORKER_DOCUMENT_ORIGINS,
      context,
    ),
    candidateReason: retentionCleanupReaders.backendEnum(
      source,
      "candidateReason",
      RETENTION_CLEANUP_CANDIDATE_REASONS,
      context,
    ),
    attemptCount: retentionCleanupReaders.backendPositiveInteger(
      source,
      "attemptCount",
      context,
    ),
    nextAttemptAt: retentionCleanupReaders.backendTimestamp(
      source,
      "nextAttemptAt",
      context,
    ),
    failureCode: retentionCleanupReaders.backendString(
      source,
      "failureCode",
      context,
    ),
    bucket: retentionCleanupReaders.backendLiteral(
      source,
      "bucket",
      RETENTION_CLEANUP_BUCKET,
      context,
    ),
    path: retentionCleanupReaders.backendString(source, "path", context),
  };
}

function parseSummary(value: unknown): Record<string, number> {
  const context = RETENTION_CLEANUP_RPC.getReport;
  const source = retentionCleanupReaders.backendObject(value, context);
  if (
    Object.keys(source).some((key) =>
      !RETENTION_CLEANUP_SUMMARY_KEYS.some((allowed) => allowed === key)
    )
  ) {
    throw new RetentionCleanupBackendContractError(context);
  }
  return Object.fromEntries(
    Object.keys(source).map((key) => [
      key,
      retentionCleanupReaders.backendNonNegativeInteger(source, key, context),
    ]),
  );
}
