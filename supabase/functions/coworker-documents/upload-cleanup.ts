import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import {
  compensateUploadReservation,
  completeUploadCleanup,
} from "../_shared/coworker-document-edge/upload-cleanup.ts";
import { RPC } from "./contracts.ts";
import {
  type CancelUploadResult,
  type CleanupResult,
  parseCancelUploadResult,
  parseCleanupResult,
} from "./upload-cleanup-contracts.ts";
import type { UploadActivationExpectation } from "./upload-contracts.ts";

export async function cancelUploadAction(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
): Promise<Response> {
  const cancellation = await cancelUploadInDatabase(
    client,
    userId,
    uploadSessionId,
  );
  const cleanup = await completeCleanup(client, userId, cancellation);

  if (cleanup === null) {
    return Response.json({
      ok: true,
      action: "cancelUpload",
      uploadSessionId,
      cancelled: true,
      cleanupStatus: "completed",
    });
  }

  return Response.json({
    ok: true,
    action: "cancelUpload",
    uploadSessionId,
    cancelled: true,
    cleanupStatus: cleanup.cleanupStatus,
    cleanupCompletedAt: cleanup.cleanupCompletedAt,
  });
}

export async function compensateReservation(
  client: SupabaseClient,
  userId: string,
  reservation: UploadActivationExpectation,
  requestId: string,
  reservationRpcName: string,
): Promise<void> {
  try {
    await compensateUploadReservation(
      () =>
        cancelUploadInDatabase(
          client,
          userId,
          reservation.uploadSessionId,
        ),
      (cancellation) => completeCleanup(client, userId, cancellation),
    );
  } catch (error) {
    console.error(JSON.stringify({
      code: "UPLOAD_RESERVATION_COMPENSATION_FAILED",
      requestId,
      rpcName: reservationRpcName,
      uploadSessionId: reservation.uploadSessionId,
      errorType: errorName(error),
    }));
  }
}

async function cancelUploadInDatabase(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
): Promise<CancelUploadResult> {
  const data = await callRpc(client, RPC.cancelUpload, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
  });
  return parseCancelUploadResult(data, uploadSessionId);
}

function completeCleanup(
  client: SupabaseClient,
  userId: string,
  cancellation: CancelUploadResult,
): Promise<CleanupResult | null> {
  return completeUploadCleanup(
    client,
    cancellation,
    (success, failureCode) =>
      recordCleanup(
        client,
        userId,
        cancellation.uploadSessionId,
        success,
        failureCode,
      ),
    (error) => logCleanupRecordFailure(cancellation.uploadSessionId, error),
  );
}

async function recordCleanup(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
  success: boolean,
  failureCode: string | null,
): Promise<CleanupResult> {
  const data = await callRpc(client, RPC.recordCleanup, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
    p_success: success,
    p_failure_code: failureCode,
  });
  return parseCleanupResult(
    data,
    uploadSessionId,
    success ? "completed" : "failed",
  );
}

function logCleanupRecordFailure(
  uploadSessionId: string,
  error: unknown,
): void {
  console.error(JSON.stringify({
    code: "CLEANUP_FAILURE_RECORD_FAILED",
    requestId: crypto.randomUUID(),
    uploadSessionId,
    errorType: errorName(error),
  }));
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
