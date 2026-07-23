import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  compensateUploadReservation,
  completeUploadCleanup,
} from "../_shared/coworker-document-edge/upload-cleanup.ts";
import type {
  SigningSourceUploadCancellation,
  SigningSourceUploadReservation,
} from "./signing-source-contracts.ts";
import {
  parseSigningSourceCleanupResult,
  parseSigningSourceUploadCancellation,
} from "./signing-source-command-contracts.ts";
import {
  cancelSigningSourceUpload,
  recordSigningSourceCleanup,
} from "./signing-source-rpc.ts";

export async function cancelSigningSourceUploadAndCleanup(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<string | null> {
  const cancellation = await cancelInDatabase(
    client,
    actorUserId,
    uploadSessionId,
  );
  return await completeCleanup(client, actorUserId, cancellation);
}

export function compensateSigningSourceUploadReservation(
  client: SupabaseClient,
  actorUserId: string,
  reservation: SigningSourceUploadReservation,
): Promise<void> {
  return compensateUploadReservation(
    () => cancelInDatabase(client, actorUserId, reservation.uploadSessionId),
    (cancellation) => completeCleanup(client, actorUserId, cancellation),
  );
}

async function cancelInDatabase(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<SigningSourceUploadCancellation> {
  const data = await cancelSigningSourceUpload(
    client,
    actorUserId,
    uploadSessionId,
  );
  return parseSigningSourceUploadCancellation(data, uploadSessionId);
}

async function completeCleanup(
  client: SupabaseClient,
  actorUserId: string,
  cancellation: SigningSourceUploadCancellation,
): Promise<string | null> {
  const cleanup = await completeUploadCleanup(
    client,
    cancellation,
    async (success, failureCode) => {
      const data = await recordSigningSourceCleanup(
        client,
        actorUserId,
        cancellation.uploadSessionId,
        success,
        failureCode,
      );
      return parseSigningSourceCleanupResult(
        data,
        cancellation.uploadSessionId,
        success ? "completed" : "failed",
      );
    },
    (error) => logCleanupRecordFailure(cancellation.uploadSessionId, error),
  );
  return cleanup?.cleanupCompletedAt ?? null;
}

function logCleanupRecordFailure(
  uploadSessionId: string,
  error: unknown,
): void {
  console.error(JSON.stringify({
    code: "CLEANUP_FAILURE_RECORD_FAILED",
    uploadSessionId,
    errorType: error instanceof Error ? error.name : "UnknownError",
  }));
}
