import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  downloadStorageObject,
  uploadStorageBytes,
} from "../coworker-document-edge/signed-storage.ts";
import {
  compensateUploadReservation,
  completeUploadCleanup,
  StorageCleanupError,
} from "../coworker-document-edge/upload-cleanup.ts";
import {
  BackendContractError,
  QuestionnaireDocumentCleanupError,
  QuestionnaireDocumentFinalizationError,
  QuestionnaireDocumentStorageError,
  RpcCallError,
} from "./errors.ts";
import {
  assertRecoveredQuestionnaireDocumentReservation,
  type QuestionnaireDocumentReservation,
} from "./questionnaire-document-contracts.ts";
import { logQuestionnaireDocumentFailure } from "./questionnaire-document-log.ts";
import {
  cancelQuestionnaireDocumentUpload,
  finalizeQuestionnaireDocument,
  recordQuestionnaireDocumentCleanup,
  reserveQuestionnaireDocument,
} from "./questionnaire-document-rpc.ts";
import { RPC } from "./rpc-names.ts";

const PDF_CONTENT_TYPE = "application/pdf";
const STORAGE_UPLOAD_OPERATION = "questionnaire_document_upload";
const STORAGE_DOWNLOAD_OPERATION = "questionnaire_document_upload_recovery";

export async function completeQuestionnaireDocumentLifecycle(
  client: SupabaseClient,
  userId: string,
  questionnaireRevision: number,
  declarationId: string,
  reservation: QuestionnaireDocumentReservation,
  pdfBytes: Uint8Array,
  requestId: string,
): Promise<void> {
  try {
    await ensurePdfUploaded(client, reservation, pdfBytes);
  } catch (error) {
    logQuestionnaireDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_STORAGE_FAILED",
      "storage_upload_recovery",
      requestId,
      null,
      reservation,
      error,
    );
    await compensateReservation(client, userId, reservation, requestId);
    throw new QuestionnaireDocumentStorageError();
  }

  await finalizeWithRecovery(
    client,
    userId,
    questionnaireRevision,
    declarationId,
    reservation,
    pdfBytes.byteLength,
    requestId,
  );
}

async function ensurePdfUploaded(
  client: SupabaseClient,
  reservation: QuestionnaireDocumentReservation,
  pdfBytes: Uint8Array,
): Promise<void> {
  try {
    await uploadStorageBytes(
      client,
      reservation,
      pdfBytes,
      PDF_CONTENT_TYPE,
      STORAGE_UPLOAD_OPERATION,
    );
    return;
  } catch {
    const storedBytes = new Uint8Array(
      await downloadStorageObject(
        client,
        reservation,
        STORAGE_DOWNLOAD_OPERATION,
      ),
    );
    if (!equalBytes(storedBytes, pdfBytes)) {
      throw new QuestionnaireDocumentStorageError();
    }
  }
}

async function finalizeWithRecovery(
  client: SupabaseClient,
  userId: string,
  questionnaireRevision: number,
  declarationId: string,
  reservation: QuestionnaireDocumentReservation,
  expectedSizeBytes: number,
  requestId: string,
): Promise<void> {
  let finalizationError: unknown;
  try {
    await finalizeQuestionnaireDocument(client, userId, reservation);
    return;
  } catch (error) {
    finalizationError = error;
    logQuestionnaireDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_FINALIZATION_FAILED",
      "document_finalization",
      requestId,
      RPC.finalizeDocumentUpload,
      reservation,
      error,
    );
    if (error instanceof BackendContractError) throw error;
  }

  const recovered = await recoverReservation(
    client,
    userId,
    questionnaireRevision,
    declarationId,
    expectedSizeBytes,
    reservation,
    finalizationError,
    requestId,
    "finalization_recovery",
  );
  if (recovered.alreadyFinalized) return;

  try {
    await finalizeQuestionnaireDocument(client, userId, recovered);
    return;
  } catch (error) {
    finalizationError = error;
    logQuestionnaireDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_FINALIZATION_RETRY_FAILED",
      "document_finalization_retry",
      requestId,
      RPC.finalizeDocumentUpload,
      recovered,
      error,
    );
    if (error instanceof BackendContractError) throw error;
  }

  const confirmed = await recoverReservation(
    client,
    userId,
    questionnaireRevision,
    declarationId,
    expectedSizeBytes,
    recovered,
    finalizationError,
    requestId,
    "finalization_cleanup_confirmation",
  );
  if (confirmed.alreadyFinalized) return;

  await compensateReservation(client, userId, confirmed, requestId);
  throw finalizationFailure(finalizationError);
}

async function recoverReservation(
  client: SupabaseClient,
  userId: string,
  questionnaireRevision: number,
  declarationId: string,
  expectedSizeBytes: number,
  previous: QuestionnaireDocumentReservation,
  finalizationError: unknown,
  requestId: string,
  stage: string,
): Promise<QuestionnaireDocumentReservation> {
  let recovered: QuestionnaireDocumentReservation;
  try {
    recovered = await reserveQuestionnaireDocument(
      client,
      userId,
      questionnaireRevision,
      declarationId,
      expectedSizeBytes,
      previous.originalFilename,
    );
  } catch (error) {
    logQuestionnaireDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_FINALIZATION_RECOVERY_FAILED",
      stage,
      requestId,
      RPC.reserveQuestionnaireDocument,
      previous,
      error,
    );
    throw finalizationFailure(finalizationError);
  }

  try {
    assertRecoveredQuestionnaireDocumentReservation(previous, recovered);
  } catch (error) {
    logQuestionnaireDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_RESERVATION_CHANGED",
      stage,
      requestId,
      RPC.reserveQuestionnaireDocument,
      recovered,
      error,
    );
    throw error;
  }
  return recovered;
}

async function compensateReservation(
  client: SupabaseClient,
  userId: string,
  reservation: QuestionnaireDocumentReservation,
  requestId: string,
): Promise<void> {
  const uploadSessionId = reservation.uploadSessionId;
  if (uploadSessionId === null) {
    throw new BackendContractError(RPC.cancelDocumentUpload);
  }

  try {
    await compensateUploadReservation(
      () => cancelQuestionnaireDocumentUpload(client, userId, reservation),
      (cancellation) =>
        completeUploadCleanup(
          client,
          cancellation,
          (success, failureCode) =>
            recordQuestionnaireDocumentCleanup(
              client,
              userId,
              uploadSessionId,
              success,
              failureCode,
            ),
          (error) =>
            logQuestionnaireDocumentFailure(
              "QUESTIONNAIRE_DOCUMENT_CLEANUP_RECORD_FAILED",
              "cleanup_record",
              requestId,
              RPC.recordDocumentCleanup,
              reservation,
              error,
            ),
        ),
    );
  } catch (error) {
    logQuestionnaireDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_CLEANUP_FAILED",
      error instanceof StorageCleanupError
        ? "storage_cleanup"
        : "reservation_compensation",
      requestId,
      RPC.cancelDocumentUpload,
      reservation,
      error,
    );
    throw new QuestionnaireDocumentCleanupError();
  }
}

function equalBytes(first: Uint8Array, second: Uint8Array): boolean {
  if (first.byteLength !== second.byteLength) return false;
  return first.every((value, index) => value === second[index]);
}

function finalizationFailure(error: unknown): Error {
  return error instanceof RpcCallError || error instanceof BackendContractError
    ? error
    : new QuestionnaireDocumentFinalizationError();
}
