import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { BackendContractError } from "./errors.ts";
import {
  parseQuestionnaireDocumentReservation,
  type QuestionnaireDocumentReservation,
} from "./questionnaire-document-contracts.ts";
import {
  parseQuestionnaireDocumentFinalization,
  parseQuestionnaireUploadCancellation,
  parseQuestionnaireUploadCleanupResult,
  type QuestionnaireUploadCancellation,
  type QuestionnaireUploadCleanupResult,
} from "./questionnaire-document-lifecycle-contracts.ts";
import { callRpc } from "./rpc.ts";
import { RPC } from "./rpc-names.ts";

export async function reserveQuestionnaireDocument(
  client: SupabaseClient,
  userId: string,
  questionnaireRevision: number,
  declarationId: string,
  expectedSizeBytes: number,
): Promise<QuestionnaireDocumentReservation> {
  const data = await callRpc(client, RPC.reserveQuestionnaireDocument, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_questionnaire_revision: questionnaireRevision,
    p_expected_size_bytes: expectedSizeBytes,
  });
  return parseQuestionnaireDocumentReservation(data, {
    userId,
    questionnaireRevision,
    declarationId,
    expectedSizeBytes,
  });
}

export async function finalizeQuestionnaireDocument(
  client: SupabaseClient,
  userId: string,
  reservation: QuestionnaireDocumentReservation,
): Promise<void> {
  const uploadSessionId = reservation.uploadSessionId;
  if (uploadSessionId === null) {
    throw new BackendContractError(RPC.finalizeDocumentUpload);
  }
  const data = await callRpc(client, RPC.finalizeDocumentUpload, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
  });
  parseQuestionnaireDocumentFinalization(data, userId, reservation);
}

export async function cancelQuestionnaireDocumentUpload(
  client: SupabaseClient,
  userId: string,
  reservation: QuestionnaireDocumentReservation,
): Promise<QuestionnaireUploadCancellation> {
  const uploadSessionId = reservation.uploadSessionId;
  if (uploadSessionId === null) {
    throw new BackendContractError(RPC.cancelDocumentUpload);
  }
  const data = await callRpc(client, RPC.cancelDocumentUpload, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
  });
  return parseQuestionnaireUploadCancellation(data, reservation);
}

export async function recordQuestionnaireDocumentCleanup(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
  success: boolean,
  failureCode: string | null,
): Promise<QuestionnaireUploadCleanupResult> {
  const data = await callRpc(client, RPC.recordDocumentCleanup, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
    p_success: success,
    p_failure_code: failureCode,
  });
  return parseQuestionnaireUploadCleanupResult(
    data,
    uploadSessionId,
    success ? "completed" : "failed",
  );
}
