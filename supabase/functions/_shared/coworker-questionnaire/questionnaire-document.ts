import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  compensateUploadReservation,
  completeUploadCleanup,
} from "../coworker-document-edge/upload-cleanup.ts";
import {
  BackendContractError as CoworkerDocumentBackendContractError,
} from "../../coworker-documents/contract-context.ts";
import {
  parseCancelUploadResult,
  parseCleanupResult,
} from "../../coworker-documents/upload-cleanup-contracts.ts";
import { parseFinalizationResult } from "../../coworker-documents/upload-contracts.ts";
import type { QuestionnairePayload, SaveEnvelopeResult } from "./contracts.ts";
import {
  BackendContractError,
  QuestionnaireDocumentCleanupError,
  QuestionnaireDocumentFinalizationError,
  QuestionnaireDocumentStorageError,
  QuestionnairePdfGenerationError,
  RpcCallError,
} from "./errors.ts";
import {
  parseQuestionnaireDocumentReservation,
  type QuestionnaireDocumentReservation,
} from "./questionnaire-document-contracts.ts";
import { generateQuestionnairePdf } from "./questionnaire-pdf.ts";
import { callRpc } from "./rpc.ts";
import { RPC, type RpcName } from "./rpc-names.ts";

export async function ensureQuestionnaireDocument(
  client: SupabaseClient,
  userId: string,
  payload: QuestionnairePayload,
  saveResult: SaveEnvelopeResult,
  requestId: string,
): Promise<void> {
  const declaration = saveResult.currentDeclaration;
  if (
    !saveResult.isComplete ||
    !saveResult.validationPassed ||
    declaration === null
  ) {
    throw new BackendContractError(RPC.saveEnvelope);
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateQuestionnairePdf(payload, saveResult);
  } catch (error) {
    logDocumentFailure(
      "QUESTIONNAIRE_PDF_GENERATION_FAILED",
      "pdf_generation",
      requestId,
      null,
      null,
      error,
    );
    throw new QuestionnairePdfGenerationError();
  }

  const reservationData = await callRpc(
    client,
    RPC.reserveQuestionnaireDocument,
    {
      p_user_id: userId,
      p_actor_user_id: userId,
      p_questionnaire_revision: saveResult.revision,
      p_expected_size_bytes: pdfBytes.byteLength,
    },
  );
  const reservation = parseQuestionnaireDocumentReservation(
    reservationData,
    {
      userId,
      questionnaireRevision: saveResult.revision,
      declarationId: declaration.id,
      expectedSizeBytes: pdfBytes.byteLength,
    },
  );
  if (reservation.alreadyFinalized) return;

  const uploadSessionId = reservation.uploadSessionId;
  if (uploadSessionId === null) {
    throw new BackendContractError(RPC.reserveQuestionnaireDocument);
  }

  try {
    await uploadPdf(client, reservation, pdfBytes);
  } catch (error) {
    logDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_STORAGE_FAILED",
      "storage_upload",
      requestId,
      null,
      reservation,
      error,
    );
    await compensateReservation(client, userId, reservation, requestId);
    throw error;
  }

  try {
    const finalization = await callRpc(
      client,
      RPC.finalizeDocumentUpload,
      {
        p_user_id: userId,
        p_actor_user_id: userId,
        p_upload_session_id: uploadSessionId,
      },
    );
    parseQuestionnaireFinalization(
      finalization,
      userId,
      uploadSessionId,
      reservation,
    );
  } catch (error) {
    logDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_FINALIZATION_FAILED",
      "document_finalization",
      requestId,
      RPC.finalizeDocumentUpload,
      reservation,
      error,
    );
    await compensateReservation(client, userId, reservation, requestId);
    if (
      error instanceof RpcCallError ||
      error instanceof BackendContractError
    ) {
      throw error;
    }
    throw new QuestionnaireDocumentFinalizationError();
  }
}

async function uploadPdf(
  client: SupabaseClient,
  reservation: QuestionnaireDocumentReservation,
  pdfBytes: Uint8Array,
): Promise<void> {
  try {
    const { error } = await client.storage
      .from(reservation.bucket)
      .upload(reservation.path, pdfBytes, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (error !== null) throw error;
  } catch {
    throw new QuestionnaireDocumentStorageError();
  }
}

function parseQuestionnaireFinalization(
  value: unknown,
  userId: string,
  uploadSessionId: string,
  reservation: QuestionnaireDocumentReservation,
): void {
  try {
    parseFinalizationResult(value, userId, uploadSessionId, {
      documentId: reservation.documentId,
      documentVersionId: reservation.documentVersionId,
    });
  } catch (error) {
    if (error instanceof CoworkerDocumentBackendContractError) {
      throw new BackendContractError(RPC.finalizeDocumentUpload);
    }
    throw error;
  }
}

async function compensateReservation(
  client: SupabaseClient,
  userId: string,
  reservation: QuestionnaireDocumentReservation,
  requestId: string,
): Promise<void> {
  const uploadSessionId = reservation.uploadSessionId;
  if (uploadSessionId === null) {
    throw new BackendContractError(RPC.reserveQuestionnaireDocument);
  }

  try {
    await compensateUploadReservation(
      async () => {
        const data = await callRpc(client, RPC.cancelDocumentUpload, {
          p_user_id: userId,
          p_actor_user_id: userId,
          p_upload_session_id: uploadSessionId,
        });
        const cancellation = parseCancelUploadResult(data, uploadSessionId);
        if (cancellation.cleanupTarget.path !== reservation.path) {
          throw new CoworkerDocumentBackendContractError(
            RPC.cancelDocumentUpload,
          );
        }
        return cancellation;
      },
      (cancellation) =>
        completeUploadCleanup(
          client,
          cancellation,
          async (success, failureCode) => {
            const data = await callRpc(
              client,
              RPC.recordDocumentCleanup,
              {
                p_user_id: userId,
                p_actor_user_id: userId,
                p_upload_session_id: uploadSessionId,
                p_success: success,
                p_failure_code: failureCode,
              },
            );
            return parseCleanupResult(
              data,
              uploadSessionId,
              success ? "completed" : "failed",
            );
          },
          (error) =>
            logDocumentFailure(
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
    logDocumentFailure(
      "QUESTIONNAIRE_DOCUMENT_CLEANUP_FAILED",
      "reservation_compensation",
      requestId,
      RPC.cancelDocumentUpload,
      reservation,
      error,
    );
    throw new QuestionnaireDocumentCleanupError();
  }
}

function logDocumentFailure(
  code: string,
  stage: string,
  requestId: string,
  rpcName: RpcName | null,
  reservation: QuestionnaireDocumentReservation | null,
  error: unknown,
): void {
  console.error(JSON.stringify({
    code,
    requestId,
    stage,
    ...(rpcName === null ? {} : { rpcName }),
    ...(reservation === null ? {} : {
      uploadSessionId: reservation.uploadSessionId,
      documentId: reservation.documentId,
      documentVersionId: reservation.documentVersionId,
    }),
    errorType: error instanceof Error ? error.name : "UnknownError",
  }));
}
