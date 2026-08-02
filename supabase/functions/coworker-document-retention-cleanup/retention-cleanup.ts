import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { COWORKER_DOCUMENT_ORIGINS } from "../_shared/coworker-document-edge/coworker-document-models.ts";
import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { removeStorageObject } from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  parseRetentionCleanupReport,
  RETENTION_CLEANUP_BUCKET,
  RETENTION_CLEANUP_CANDIDATE_REASONS,
  RETENTION_CLEANUP_RPC,
  RetentionCleanupBackendContractError,
  type RetentionCleanupClaim,
  retentionCleanupReaders,
  type RetentionCleanupRequest,
  type RetentionCleanupRpcName,
  type RetentionCleanupWorkerItemResult,
  type RetentionCleanupWorkerResponse,
} from "./contracts.ts";
import { parseRetentionCleanupResult } from "./retention-cleanup-parser.ts";

const CLAIM_KEYS = [
  "jobId",
  "claimToken",
  "claimExpiresAt",
  "attemptCount",
  "documentVersionId",
  "documentId",
  "userId",
  "origin",
  "candidateReason",
  "versionNumber",
  "recordedSizeBytes",
  "bucket",
  "path",
] as const;
const {
  backendArrayValue,
  backendEnum,
  backendLiteral,
  backendNullablePositiveInteger,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = retentionCleanupReaders;

export async function runRetentionCleanup(
  client: SupabaseClient,
  request: RetentionCleanupRequest,
  requestId: string,
): Promise<RetentionCleanupWorkerResponse> {
  logInfo({
    code: "RETENTION_CLEANUP_STARTED",
    requestId,
    limit: request.limit,
  });

  const claims = parseRetentionCleanupClaims(
    await callRpc(client, RETENTION_CLEANUP_RPC.claim, {
      p_limit: request.limit,
    }),
  );
  const results: RetentionCleanupWorkerItemResult[] = [];

  for (const claim of claims) {
    results.push(await processClaim(client, claim, requestId));
  }

  const report = parseRetentionCleanupReport(
    await callRpc(client, RETENTION_CLEANUP_RPC.getReport, {}),
  );
  const response: RetentionCleanupWorkerResponse = {
    ok: true,
    requestId,
    claimed: claims.length,
    completed: countOutcome(results, "completed"),
    failed: countOutcome(results, "failed"),
    skipped: countOutcome(results, "skipped"),
    deadLetter: countOutcome(results, "dead_letter"),
    workerErrors: countOutcome(results, "worker_error"),
    results,
    report,
  };

  logInfo({
    code: "RETENTION_CLEANUP_FINISHED",
    requestId,
    claimed: response.claimed,
    completed: response.completed,
    failed: response.failed,
    skipped: response.skipped,
    deadLetter: response.deadLetter,
    workerErrors: response.workerErrors,
  });
  return response;
}

async function processClaim(
  client: SupabaseClient,
  claim: RetentionCleanupClaim,
  requestId: string,
): Promise<RetentionCleanupWorkerItemResult> {
  const storageRemoved = await removeStorageObject(client, {
    bucket: claim.bucket,
    path: claim.path,
  });

  try {
    const result = parseRetentionCleanupResult(
      await callRpc(client, RETENTION_CLEANUP_RPC.recordResult, {
        p_job_id: claim.jobId,
        p_claim_token: claim.claimToken,
        p_success: storageRemoved,
        p_failure_code: storageRemoved ? null : "storage_remove_failed",
      }),
      claim,
    );

    logRecordedOutcome(result, requestId);
    return result;
  } catch (error) {
    logWorkerError(
      requestId,
      error,
      claim,
      storageRemoved ? "cleanup_result_record_failed" : undefined,
    );
    return {
      jobId: claim.jobId,
      documentVersionId: claim.documentVersionId,
      outcome: "worker_error",
      attemptCount: claim.attemptCount,
      failureCode: null,
      retryAfter: null,
      versionRowDeleted: null,
      idempotent: null,
    };
  }
}

function logRecordedOutcome(
  result: RetentionCleanupWorkerItemResult,
  requestId: string,
): void {
  if (result.outcome === "failed") {
    logError({
      code: "RETENTION_CLEANUP_JOB_FAILED",
      requestId,
      jobId: result.jobId,
      documentVersionId: result.documentVersionId,
      attemptCount: result.attemptCount,
      failureCode: result.failureCode,
    });
  } else if (result.outcome === "dead_letter") {
    logError({
      code: "RETENTION_CLEANUP_DEAD_LETTER",
      requestId,
      jobId: result.jobId,
      documentVersionId: result.documentVersionId,
      attemptCount: result.attemptCount,
      failureCode: result.failureCode,
    });
  }
}

export function logWorkerError(
  requestId: string,
  error: unknown,
  claim?: RetentionCleanupClaim,
  errorType?: string,
): void {
  logError({
    code: "RETENTION_CLEANUP_WORKER_ERROR",
    requestId,
    ...(claim === undefined ? {} : {
      jobId: claim.jobId,
      documentVersionId: claim.documentVersionId,
      attemptCount: claim.attemptCount,
    }),
    errorType: errorType ??
      (error instanceof Error ? error.name : "UnknownError"),
  });
}

function countOutcome(
  results: RetentionCleanupWorkerItemResult[],
  outcome: RetentionCleanupWorkerItemResult["outcome"],
): number {
  return results.filter((result) => result.outcome === outcome).length;
}

function logInfo(entry: Record<string, unknown>): void {
  console.info(JSON.stringify(entry));
}

function logError(entry: Record<string, unknown>): void {
  console.error(JSON.stringify(entry));
}

function parseRetentionCleanupClaims(
  value: unknown,
): RetentionCleanupClaim[] {
  const claims = backendArrayValue(value, RETENTION_CLEANUP_RPC.claim).map(
    parseClaim,
  );
  assertUnique(claims.map((claim) => claim.jobId));
  assertUnique(claims.map((claim) => claim.claimToken));
  assertUnique(claims.map((claim) => claim.documentVersionId));
  assertUnique(claims.map((claim) => `${claim.bucket}\u0000${claim.path}`));
  return claims;
}

function parseClaim(value: unknown): RetentionCleanupClaim {
  const context = RETENTION_CLEANUP_RPC.claim;
  const source = backendObject(value, context, CLAIM_KEYS);
  return {
    jobId: backendUuid(source, "jobId", context),
    claimToken: backendUuid(source, "claimToken", context),
    claimExpiresAt: backendTimestamp(source, "claimExpiresAt", context),
    attemptCount: backendPositiveInteger(source, "attemptCount", context),
    documentVersionId: backendUuid(source, "documentVersionId", context),
    documentId: backendUuid(source, "documentId", context),
    userId: backendUuid(source, "userId", context),
    origin: backendEnum(source, "origin", COWORKER_DOCUMENT_ORIGINS, context),
    candidateReason: backendEnum(
      source,
      "candidateReason",
      RETENTION_CLEANUP_CANDIDATE_REASONS,
      context,
    ),
    versionNumber: backendPositiveInteger(source, "versionNumber", context),
    recordedSizeBytes: backendNullablePositiveInteger(
      source,
      "recordedSizeBytes",
      context,
    ),
    bucket: backendLiteral(source, "bucket", RETENTION_CLEANUP_BUCKET, context),
    path: parseClaimPath(source, context),
  };
}

function parseClaimPath(
  source: Record<string, unknown>,
  context: RetentionCleanupRpcName,
): string {
  const path = backendString(source, "path", context);
  if (
    path.trim() === "" ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("?") ||
    path.includes("#") ||
    path.split("/").some((segment) => segment === "." || segment === "..")
  ) {
    throw new RetentionCleanupBackendContractError(context);
  }
  return path;
}

function assertUnique(values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new RetentionCleanupBackendContractError(
      RETENTION_CLEANUP_RPC.claim,
    );
  }
}
