import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { removeStorageObject, type StorageObject } from "./signed-storage.ts";

export const STORAGE_REMOVE_FAILURE_CODE = "storage_remove_failed";

export interface UploadCancellation {
  uploadSessionId: string;
  cleanupStatus: "not_required" | "pending" | "completed" | "failed";
  cleanupTarget: StorageObject;
}

export interface UploadCleanupResult {
  cleanupCompletedAt: string | null;
}

export class StorageCleanupError extends Error {
  constructor(readonly uploadSessionId: string) {
    super("Upload was cancelled, but Storage cleanup failed.");
    this.name = "StorageCleanupError";
  }
}

export async function completeUploadCleanup<Result extends UploadCleanupResult>(
  client: SupabaseClient,
  cancellation: UploadCancellation,
  recordCleanup: (
    success: boolean,
    failureCode: string | null,
  ) => Promise<Result>,
  logCleanupRecordFailure: (error: unknown) => void,
): Promise<Result | null> {
  if (
    cancellation.cleanupStatus === "completed" ||
    cancellation.cleanupStatus === "not_required"
  ) {
    return null;
  }

  const removed = await removeStorageObject(
    client,
    cancellation.cleanupTarget,
  );
  if (!removed) {
    try {
      await recordCleanup(false, STORAGE_REMOVE_FAILURE_CODE);
    } catch (error) {
      logCleanupRecordFailure(error);
    }
    throw new StorageCleanupError(cancellation.uploadSessionId);
  }

  return await recordCleanup(true, null);
}

export async function compensateUploadReservation<
  Cancellation extends UploadCancellation,
>(
  cancelUpload: () => Promise<Cancellation>,
  completeCleanup: (cancellation: Cancellation) => Promise<unknown>,
): Promise<void> {
  const cancellation = await cancelUpload();
  await completeCleanup(cancellation);
}
