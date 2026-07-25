import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type { QuestionnairePayload, SaveEnvelopeResult } from "./contracts.ts";
import {
  BackendContractError,
  QuestionnairePdfGenerationError,
} from "./errors.ts";
import { completeQuestionnaireDocumentLifecycle } from "./questionnaire-document-lifecycle.ts";
import { logQuestionnaireDocumentFailure } from "./questionnaire-document-log.ts";
import { reserveQuestionnaireDocument } from "./questionnaire-document-rpc.ts";
import { generateQuestionnairePdf } from "./questionnaire-pdf.ts";
import { RPC } from "./rpc-names.ts";

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
    logQuestionnaireDocumentFailure(
      "QUESTIONNAIRE_PDF_GENERATION_FAILED",
      "pdf_generation",
      requestId,
      null,
      null,
      error,
    );
    throw new QuestionnairePdfGenerationError();
  }

  const reservation = await reserveQuestionnaireDocument(
    client,
    userId,
    saveResult.revision,
    declaration.id,
    pdfBytes.byteLength,
  );
  if (reservation.alreadyFinalized) return;

  await completeQuestionnaireDocumentLifecycle(
    client,
    userId,
    saveResult.revision,
    declaration.id,
    reservation,
    pdfBytes,
    requestId,
  );
}
