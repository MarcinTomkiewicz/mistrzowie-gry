import { COWORKER_DOCUMENT_ORIGINS } from "../coworker-document-edge/coworker-document-models.ts";
import {
  RETENTION_CLEANUP_BUCKET,
  RETENTION_CLEANUP_CANDIDATE_REASONS,
  RETENTION_CLEANUP_RPC,
  RETENTION_CLEANUP_SUMMARY_KEYS,
  RetentionCleanupBackendContractError,
  retentionCleanupReaders,
  type RetentionCleanupReport,
  type RetentionCleanupReportFailedJob,
} from "./contracts.ts";

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

const {
  backendArray,
  backendEnum,
  backendLiteral,
  backendNonNegativeInteger,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = retentionCleanupReaders;

export function parseRetentionCleanupReport(
  value: unknown,
): RetentionCleanupReport {
  const context = RETENTION_CLEANUP_RPC.getReport;
  const source = backendObject(value, context, REPORT_KEYS);
  return {
    summary: parseSummary(source.summary),
    completedVersionCount: backendNonNegativeInteger(
      source,
      "completedVersionCount",
      context,
    ),
    completedRecordedBytes: backendNonNegativeInteger(
      source,
      "completedRecordedBytes",
      context,
    ),
    readyToRetry: backendNonNegativeInteger(source, "readyToRetry", context),
    deadLetterCount: backendNonNegativeInteger(
      source,
      "deadLetterCount",
      context,
    ),
    failedJobs: backendArray(source, "failedJobs", context).map(parseFailedJob),
  };
}

function parseFailedJob(value: unknown): RetentionCleanupReportFailedJob {
  const context = RETENTION_CLEANUP_RPC.getReport;
  const source = backendObject(value, context, FAILED_JOB_KEYS);
  return {
    jobId: backendUuid(source, "jobId", context),
    documentVersionId: backendUuid(source, "documentVersionId", context),
    documentId: backendUuid(source, "documentId", context),
    origin: backendEnum(source, "origin", COWORKER_DOCUMENT_ORIGINS, context),
    candidateReason: backendEnum(
      source,
      "candidateReason",
      RETENTION_CLEANUP_CANDIDATE_REASONS,
      context,
    ),
    attemptCount: backendPositiveInteger(source, "attemptCount", context),
    nextAttemptAt: backendTimestamp(source, "nextAttemptAt", context),
    failureCode: backendString(source, "failureCode", context),
    bucket: backendLiteral(source, "bucket", RETENTION_CLEANUP_BUCKET, context),
    path: backendString(source, "path", context),
  };
}

function parseSummary(value: unknown): Record<string, number> {
  const context = RETENTION_CLEANUP_RPC.getReport;
  const source = backendObject(value, context);
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
      backendNonNegativeInteger(source, key, context),
    ]),
  );
}
