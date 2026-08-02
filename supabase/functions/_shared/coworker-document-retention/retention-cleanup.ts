import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../coworker-document-edge/rpc.ts";
import { removeStorageObject } from "../coworker-document-edge/signed-storage.ts";
import {
  RETENTION_CLEANUP_RPC,
  RetentionCleanupBackendContractError,
  type RetentionCleanupClaim,
  type RetentionCleanupRequest,
  type RetentionCleanupSource,
  type RetentionCleanupWorkerItemResult,
  type RetentionCleanupWorkerResponse,
} from "./contracts.ts";
import { parseRetentionCleanupClaims } from "./retention-cleanup-claim-parser.ts";
import { parseRetentionCleanupResult } from "./retention-cleanup-parser.ts";
import { parseRetentionCleanupReport } from "./retention-cleanup-report-parser.ts";

export async function runRetentionCleanup(
  client: SupabaseClient,
  request: RetentionCleanupRequest,
  requestId: string,
): Promise<RetentionCleanupWorkerResponse> {
  logInfo({
    code: "RETENTION_CLEANUP_STARTED",
    requestId,
    limit: request.limit,
    documentId: request.documentId,
  });

  const claims = await claimRetentionJobs(client, request);
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
    documentId: request.documentId,
    claimed: response.claimed,
    completed: response.completed,
    failed: response.failed,
    skipped: response.skipped,
    deadLetter: response.deadLetter,
    workerErrors: response.workerErrors,
  });
  return response;
}

export async function attemptDocumentRetentionCleanup(
  client: SupabaseClient,
  documentId: string,
  requestId: string,
  source: RetentionCleanupSource,
): Promise<void> {
  try {
    const result = await runRetentionCleanup(
      client,
      { limit: 100, documentId },
      requestId,
    );
    if (result.workerErrors > 0) {
      logDeferredCleanup(requestId, documentId, source, "WorkerItemError");
    }
  } catch (error) {
    logDeferredCleanup(requestId, documentId, source, errorName(error));
  }
}

async function claimRetentionJobs(
  client: SupabaseClient,
  request: RetentionCleanupRequest,
): Promise<RetentionCleanupClaim[]> {
  const rpcName = request.documentId === null
    ? RETENTION_CLEANUP_RPC.claim
    : RETENTION_CLEANUP_RPC.claimForDocument;
  const parameters = request.documentId === null
    ? { p_limit: request.limit }
    : { p_document_id: request.documentId, p_limit: request.limit };
  const claims = parseRetentionCleanupClaims(
    await callRpc(client, rpcName, parameters),
    rpcName,
  );
  if (
    request.documentId !== null &&
    claims.some((claim) => claim.documentId !== request.documentId)
  ) {
    throw new RetentionCleanupBackendContractError(rpcName);
  }
  return claims;
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

function logDeferredCleanup(
  requestId: string,
  documentId: string,
  source: RetentionCleanupSource,
  errorType: string,
): void {
  logError({
    code: "RETENTION_CLEANUP_DEFERRED",
    requestId,
    documentId,
    source,
    errorType,
  });
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
