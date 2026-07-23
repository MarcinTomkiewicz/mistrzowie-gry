import { COWORKER_DOCUMENTS_BUCKET } from "../_shared/coworker-document-edge/storage-config.ts";
import { RPC } from "./contracts.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
} from "./contract-context.ts";

export interface CancelUploadResult {
  uploadSessionId: string;
  cancelled: true;
  cleanupStatus: "not_required" | "pending" | "completed" | "failed";
  cleanupTarget: {
    bucket: string;
    path: string;
  };
}

export interface CleanupResult {
  uploadSessionId: string;
  cleanupStatus: "completed" | "failed";
  cleanupAttemptedAt: string;
  cleanupCompletedAt: string | null;
  failureCode: string | null;
}

const {
  backendEnum,
  backendLiteral,
  backendNullableString,
  backendNullableTimestamp,
  backendObject,
  backendString,
  backendTimestamp,
  backendUuid,
} = coworkerDocumentReaders;

export function parseCancelUploadResult(
  value: unknown,
  uploadSessionId: string,
): CancelUploadResult {
  const result = backendObject(value, RPC.cancelUpload);
  const target = backendObject(result.cleanupTarget, RPC.cancelUpload);
  const parsed: CancelUploadResult = {
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.cancelUpload,
    ),
    cancelled: backendLiteral(result, "cancelled", true, RPC.cancelUpload),
    cleanupStatus: backendEnum(
      result,
      "cleanupStatus",
      ["not_required", "pending", "completed", "failed"] as const,
      RPC.cancelUpload,
    ),
    cleanupTarget: {
      bucket: backendString(target, "bucket", RPC.cancelUpload),
      path: backendString(target, "path", RPC.cancelUpload),
    },
  };

  if (
    parsed.uploadSessionId !== uploadSessionId ||
    parsed.cleanupTarget.bucket !== COWORKER_DOCUMENTS_BUCKET
  ) {
    throw new BackendContractError(RPC.cancelUpload);
  }
  return parsed;
}

export function parseCleanupResult(
  value: unknown,
  uploadSessionId: string,
  expectedStatus: "completed" | "failed",
): CleanupResult {
  const result = backendObject(value, RPC.recordCleanup);
  const parsed: CleanupResult = {
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.recordCleanup,
    ),
    cleanupStatus: backendEnum(
      result,
      "cleanupStatus",
      ["completed", "failed"] as const,
      RPC.recordCleanup,
    ),
    cleanupAttemptedAt: backendTimestamp(
      result,
      "cleanupAttemptedAt",
      RPC.recordCleanup,
    ),
    cleanupCompletedAt: backendNullableTimestamp(
      result,
      "cleanupCompletedAt",
      RPC.recordCleanup,
    ),
    failureCode: backendNullableString(
      result,
      "failureCode",
      RPC.recordCleanup,
    ),
  };

  if (
    parsed.uploadSessionId !== uploadSessionId ||
    parsed.cleanupStatus !== expectedStatus ||
    (expectedStatus === "completed" &&
      (parsed.cleanupCompletedAt === null || parsed.failureCode !== null)) ||
    (expectedStatus === "failed" && parsed.failureCode === null)
  ) {
    throw new BackendContractError(RPC.recordCleanup);
  }
  return parsed;
}
