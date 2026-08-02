import {
  RETENTION_CLEANUP_DEAD_LETTER_FAILURE_CODES,
  RETENTION_CLEANUP_RPC,
  RetentionCleanupBackendContractError,
  type RetentionCleanupClaim,
  retentionCleanupReaders,
  type RetentionCleanupWorkerItemResult,
} from "./contracts.ts";

const COMPLETED_KEYS = [
  "jobId",
  "documentVersionId",
  "status",
  "attemptCount",
  "versionRowDeleted",
  "storageDeletedAt",
  "completedAt",
  "idempotent",
] as const;
const FAILED_KEYS = [
  "jobId",
  "documentVersionId",
  "status",
  "attemptCount",
  "failureCode",
  "retryAfter",
  "idempotent",
] as const;
const STORAGE_EXISTS_KEYS = [
  ...FAILED_KEYS,
  "storageObjectStillExists",
  "versionRowDeleted",
] as const;
const DEAD_LETTER_KEYS = [
  "jobId",
  "documentVersionId",
  "status",
  "attemptCount",
  "failureCode",
  "protectionReasons",
  "deadLetter",
  "storageObjectStillExists",
  "versionRowDeleted",
  "idempotent",
] as const;
const SKIPPED_KEYS = [
  "jobId",
  "documentVersionId",
  "status",
  "skipReason",
  "idempotent",
] as const;
const RESULT_STATUSES = ["completed", "failed", "skipped"] as const;

const {
  backendArray,
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = retentionCleanupReaders;

export function parseRetentionCleanupResult(
  value: unknown,
  claim: RetentionCleanupClaim,
): RetentionCleanupWorkerItemResult {
  const context = RETENTION_CLEANUP_RPC.recordResult;
  const source = backendObject(value, context);
  const status = backendEnum(source, "status", RESULT_STATUSES, context);
  if (status === "completed") return parseCompleted(value, claim);
  if (status === "skipped") return parseSkipped(value, claim);

  const failureCode = backendString(source, "failureCode", context);
  if (
    RETENTION_CLEANUP_DEAD_LETTER_FAILURE_CODES.some((code) =>
      code === failureCode
    )
  ) {
    return parseDeadLetter(value, claim);
  }
  return parseFailed(value, claim, failureCode);
}

function parseCompleted(
  value: unknown,
  claim: RetentionCleanupClaim,
): RetentionCleanupWorkerItemResult {
  const context = RETENTION_CLEANUP_RPC.recordResult;
  const source = backendObject(value, context, COMPLETED_KEYS);
  const identity = parseResultIdentity(source, claim);
  backendLiteral(source, "status", "completed", context);
  backendTimestamp(source, "storageDeletedAt", context);
  backendTimestamp(source, "completedAt", context);
  const versionRowDeleted = backendBoolean(
    source,
    "versionRowDeleted",
    context,
  );
  const idempotent = backendBoolean(source, "idempotent", context);
  if (!idempotent && !versionRowDeleted) {
    throw new RetentionCleanupBackendContractError(context);
  }
  return {
    ...identity,
    outcome: "completed",
    attemptCount: backendPositiveInteger(source, "attemptCount", context),
    failureCode: null,
    retryAfter: null,
    versionRowDeleted,
    idempotent,
  };
}

function parseFailed(
  value: unknown,
  claim: RetentionCleanupClaim,
  failureCode: string,
): RetentionCleanupWorkerItemResult {
  const context = RETENTION_CLEANUP_RPC.recordResult;
  const storageObjectStillExists = failureCode ===
    "storage_object_still_exists";
  const source = backendObject(
    value,
    context,
    storageObjectStillExists ? STORAGE_EXISTS_KEYS : FAILED_KEYS,
  );
  const identity = parseResultIdentity(source, claim);
  backendLiteral(source, "status", "failed", context);
  backendLiteral(source, "idempotent", false, context);
  if (storageObjectStillExists) {
    backendLiteral(source, "storageObjectStillExists", true, context);
    backendLiteral(source, "versionRowDeleted", false, context);
  }
  return {
    ...identity,
    outcome: "failed",
    attemptCount: backendPositiveInteger(source, "attemptCount", context),
    failureCode: backendString(source, "failureCode", context),
    retryAfter: backendTimestamp(source, "retryAfter", context),
    versionRowDeleted: storageObjectStillExists ? false : null,
    idempotent: false,
  };
}

function parseDeadLetter(
  value: unknown,
  claim: RetentionCleanupClaim,
): RetentionCleanupWorkerItemResult {
  const context = RETENTION_CLEANUP_RPC.recordResult;
  const source = backendObject(value, context, DEAD_LETTER_KEYS);
  const identity = parseResultIdentity(source, claim);
  backendLiteral(source, "status", "failed", context);
  backendArray(source, "protectionReasons", context).forEach((reason) =>
    backendString({ reason }, "reason", context)
  );
  backendLiteral(source, "deadLetter", true, context);
  backendLiteral(source, "storageObjectStillExists", false, context);
  backendLiteral(source, "versionRowDeleted", false, context);
  backendLiteral(source, "idempotent", false, context);
  return {
    ...identity,
    outcome: "dead_letter",
    attemptCount: backendPositiveInteger(source, "attemptCount", context),
    failureCode: backendEnum(
      source,
      "failureCode",
      RETENTION_CLEANUP_DEAD_LETTER_FAILURE_CODES,
      context,
    ),
    retryAfter: null,
    versionRowDeleted: false,
    idempotent: false,
  };
}

function parseSkipped(
  value: unknown,
  claim: RetentionCleanupClaim,
): RetentionCleanupWorkerItemResult {
  const context = RETENTION_CLEANUP_RPC.recordResult;
  const source = backendObject(value, context, SKIPPED_KEYS);
  const identity = parseResultIdentity(source, claim);
  backendLiteral(source, "status", "skipped", context);
  return {
    ...identity,
    outcome: "skipped",
    attemptCount: claim.attemptCount,
    failureCode: backendString(source, "skipReason", context),
    retryAfter: null,
    versionRowDeleted: null,
    idempotent: backendBoolean(source, "idempotent", context),
  };
}

function parseResultIdentity(
  source: Record<string, unknown>,
  claim: RetentionCleanupClaim,
): Pick<RetentionCleanupWorkerItemResult, "jobId" | "documentVersionId"> {
  const context = RETENTION_CLEANUP_RPC.recordResult;
  const identity = {
    jobId: backendUuid(source, "jobId", context),
    documentVersionId: backendUuid(source, "documentVersionId", context),
  };
  if (
    identity.jobId !== claim.jobId ||
    identity.documentVersionId !== claim.documentVersionId
  ) {
    throw new RetentionCleanupBackendContractError(context);
  }
  return identity;
}
