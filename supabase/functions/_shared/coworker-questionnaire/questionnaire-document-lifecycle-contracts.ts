import { createCoworkerDocumentParser } from "../coworker-document-edge/coworker-document-parser.ts";
import { createContractReaders } from "../coworker-document-edge/contract-readers.ts";
import { COWORKER_DOCUMENTS_BUCKET } from "../coworker-document-edge/storage-config.ts";
import type {
  UploadCancellation,
  UploadCleanupResult,
} from "../coworker-document-edge/upload-cleanup.ts";
import { BackendContractError } from "./errors.ts";
import type { QuestionnaireDocumentReservation } from "./questionnaire-document-contracts.ts";
import { RPC, type RpcName } from "./rpc-names.ts";

const CANCELLATION_KEYS = [
  "uploadSessionId",
  "cancelled",
  "cleanupStatus",
  "cleanupTarget",
] as const;
const CLEANUP_TARGET_KEYS = ["bucket", "path"] as const;
const CLEANUP_KEYS = [
  "uploadSessionId",
  "cleanupStatus",
  "cleanupAttemptedAt",
  "cleanupCompletedAt",
  "failureCode",
] as const;
const FINALIZATION_KEYS = [
  "uploadSessionId",
  "finalized",
  "document",
] as const;

export interface QuestionnaireUploadCancellation extends UploadCancellation {
  cancelled: true;
}

export interface QuestionnaireUploadCleanupResult extends UploadCleanupResult {
  uploadSessionId: string;
  cleanupStatus: "completed" | "failed";
  cleanupAttemptedAt: string;
  failureCode: string | null;
}

const readers = createContractReaders<RpcName>({
  createRequestError: () => new BackendContractError(),
  createBackendError: (rpcName) => new BackendContractError(rpcName),
  allowEmptyBackendNullableString: false,
});
const {
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendNullableString,
  backendNullableTimestamp,
  backendObject,
  backendString,
  backendTimestamp,
  backendUuid,
} = readers;
const { parseCoworkerDocument } = createCoworkerDocumentParser(
  readers,
  (rpcName) => new BackendContractError(rpcName),
);

export function parseQuestionnaireUploadCancellation(
  value: unknown,
  reservation: QuestionnaireDocumentReservation,
): QuestionnaireUploadCancellation {
  const rpcName = RPC.cancelDocumentUpload;
  const source = backendObject(value, rpcName, CANCELLATION_KEYS);
  const cleanupTarget = backendObject(
    source.cleanupTarget,
    rpcName,
    CLEANUP_TARGET_KEYS,
  );
  const cancellation: QuestionnaireUploadCancellation = {
    uploadSessionId: backendUuid(source, "uploadSessionId", rpcName),
    cancelled: backendLiteral(source, "cancelled", true, rpcName),
    cleanupStatus: backendEnum(
      source,
      "cleanupStatus",
      ["not_required", "pending", "completed", "failed"] as const,
      rpcName,
    ),
    cleanupTarget: {
      bucket: backendString(cleanupTarget, "bucket", rpcName),
      path: backendString(cleanupTarget, "path", rpcName),
    },
  };

  if (
    cancellation.uploadSessionId !== reservation.uploadSessionId ||
    cancellation.cleanupTarget.bucket !== COWORKER_DOCUMENTS_BUCKET ||
    cancellation.cleanupTarget.path !== reservation.path
  ) {
    throw new BackendContractError(rpcName);
  }
  return cancellation;
}

export function parseQuestionnaireUploadCleanupResult(
  value: unknown,
  uploadSessionId: string,
  expectedStatus: "completed" | "failed",
): QuestionnaireUploadCleanupResult {
  const rpcName = RPC.recordDocumentCleanup;
  const source = backendObject(value, rpcName, CLEANUP_KEYS);
  const result: QuestionnaireUploadCleanupResult = {
    uploadSessionId: backendUuid(source, "uploadSessionId", rpcName),
    cleanupStatus: backendEnum(
      source,
      "cleanupStatus",
      ["completed", "failed"] as const,
      rpcName,
    ),
    cleanupAttemptedAt: backendTimestamp(
      source,
      "cleanupAttemptedAt",
      rpcName,
    ),
    cleanupCompletedAt: backendNullableTimestamp(
      source,
      "cleanupCompletedAt",
      rpcName,
    ),
    failureCode: backendNullableString(source, "failureCode", rpcName),
  };

  if (
    result.uploadSessionId !== uploadSessionId ||
    result.cleanupStatus !== expectedStatus ||
    (expectedStatus === "completed" &&
      (result.cleanupCompletedAt === null || result.failureCode !== null)) ||
    (expectedStatus === "failed" && result.failureCode === null)
  ) {
    throw new BackendContractError(rpcName);
  }
  return result;
}

export function parseQuestionnaireDocumentFinalization(
  value: unknown,
  userId: string,
  reservation: QuestionnaireDocumentReservation,
): void {
  const rpcName = RPC.finalizeDocumentUpload;
  const uploadSessionId = reservation.uploadSessionId;
  if (uploadSessionId === null) {
    throw new BackendContractError(rpcName);
  }

  const source = backendObject(value, rpcName, FINALIZATION_KEYS);
  if (
    backendUuid(source, "uploadSessionId", rpcName) !== uploadSessionId ||
    backendBoolean(source, "finalized", rpcName) !== true
  ) {
    throw new BackendContractError(rpcName);
  }

  const document = parseCoworkerDocument(source.document, rpcName);
  const currentVersion = document.currentVersion;
  if (
    document.userId !== userId ||
    document.id !== reservation.documentId ||
    document.currentVersionId !== reservation.documentVersionId ||
    currentVersion === null
  ) {
    throw new BackendContractError(rpcName);
  }

  if (
    currentVersion.id !== reservation.documentVersionId ||
    currentVersion.status !== "ready" ||
    currentVersion.expectedSizeBytes !== reservation.expectedSizeBytes ||
    currentVersion.sizeBytes !== reservation.expectedSizeBytes ||
    currentVersion.declaredMimeType !== "application/pdf" ||
    (currentVersion.detectedMimeType !== null &&
      currentVersion.detectedMimeType !== "application/pdf") ||
    currentVersion.signatureDeclarationType !== "unsigned" ||
    currentVersion.finalizedAt === null
  ) {
    throw new BackendContractError(rpcName);
  }
}
