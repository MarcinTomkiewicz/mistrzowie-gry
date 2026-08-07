import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  IRegisterQuestionnairePrivateDocumentResult,
} from "../../../../src/app/core/interfaces/i-admin-coworker-onboarding.ts";
import type {
  ICoworkerOnboardingRow,
  ICoworkerPrivateDocumentRow,
} from "../../../../src/app/core/interfaces/i-coworker-onboarding.ts";
import {
  callCoworkerRpc,
  callSingleCoworkerRpc,
  CoworkerDocumentStorageError,
  removeDocumentPaths,
  uploadPdf,
} from "../coworker-documents.ts";
import type {
  QuestionnaireEnvelope,
  QuestionnairePayload,
  SaveEnvelopeResult,
} from "./contracts.ts";
import {
  BackendContractError,
  QuestionnaireDocumentStorageError,
  QuestionnaireOnboardingStateError,
  QuestionnairePdfGenerationError,
} from "./errors.ts";
import { buildQuestionnairePdfFilename } from "./questionnaire-document-filename.ts";
import { generateQuestionnairePdf } from "./questionnaire-pdf.ts";
import { RPC } from "./rpc-names.ts";

const GET_ONBOARDING_RPC = "get_coworker_onboarding";
const LIST_PRIVATE_DOCUMENTS_RPC = "list_coworker_private_documents";
const REGISTER_DOCUMENT_RPC = "register_questionnaire_private_document";
const QUESTIONNAIRE_TITLE = "Kwestionariusz osobowy";

type QuestionnaireDocumentState = Pick<
  SaveEnvelopeResult,
  "isComplete" | "validationPassed" | "currentDeclaration"
>;

export async function ensureQuestionnaireDocument(
  adminClient: SupabaseClient,
  userClient: SupabaseClient,
  payload: QuestionnairePayload,
  questionnaire: QuestionnaireDocumentState,
): Promise<void> {
  if (
    !questionnaire.isComplete ||
    !questionnaire.validationPassed ||
    questionnaire.currentDeclaration === null
  ) {
    throw new BackendContractError(RPC.saveEnvelope);
  }

  const onboardingRows = await callCoworkerRpc<ICoworkerOnboardingRow[]>(
    userClient,
    GET_ONBOARDING_RPC,
  );
  const onboarding = onboardingRows[0];
  if (onboarding === undefined || onboarding.status !== "in_progress") {
    throw new QuestionnaireOnboardingStateError();
  }

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await generateQuestionnairePdf(payload, questionnaire);
  } catch {
    throw new QuestionnairePdfGenerationError();
  }

  const originalFilename = buildQuestionnairePdfFilename(
    payload.personal.firstName,
    payload.personal.lastName,
  );
  const storagePath =
    `questionnaire/${onboarding.onboarding_id}/${crypto.randomUUID()}.pdf`;
  try {
    await uploadPdf(adminClient, storagePath, pdfBytes);
  } catch (error) {
    if (error instanceof CoworkerDocumentStorageError) {
      throw new QuestionnaireDocumentStorageError();
    }
    throw error;
  }

  let result: IRegisterQuestionnairePrivateDocumentResult;
  try {
    result = await callSingleCoworkerRpc<
      IRegisterQuestionnairePrivateDocumentResult
    >(adminClient, REGISTER_DOCUMENT_RPC, {
      p_onboarding_id: onboarding.onboarding_id,
      p_title: QUESTIONNAIRE_TITLE,
      p_storage_path: storagePath,
      p_original_filename: originalFilename,
      p_mime_type: "application/pdf",
      p_size_bytes: pdfBytes.byteLength,
    });
  } catch (error) {
    try {
      await removeDocumentPaths(adminClient, [storagePath]);
    } catch {
      throw new QuestionnaireDocumentStorageError();
    }
    throw error;
  }

  if (result.replaced_storage_path !== null) {
    try {
      await removeDocumentPaths(adminClient, [result.replaced_storage_path]);
    } catch (error) {
      console.error(JSON.stringify({
        code: "POST_COMMIT_STORAGE_CLEANUP_FAILED",
        operation: "replace_questionnaire_document",
        storagePath: result.replaced_storage_path,
        errorType: error instanceof Error ? error.name : "UnknownError",
      }));
    }
  }
}

export async function reconcileQuestionnaireDocument(
  adminClient: SupabaseClient,
  userClient: SupabaseClient,
  payload: QuestionnairePayload,
  questionnaire: QuestionnaireEnvelope,
): Promise<void> {
  if (
    !questionnaire.isComplete ||
    !questionnaire.validationPassed ||
    questionnaire.currentDeclaration === null
  ) {
    return;
  }

  const [onboardingRows, privateDocuments] = await Promise.all([
    callCoworkerRpc<ICoworkerOnboardingRow[]>(
      userClient,
      GET_ONBOARDING_RPC,
    ),
    callCoworkerRpc<ICoworkerPrivateDocumentRow[]>(
      userClient,
      LIST_PRIVATE_DOCUMENTS_RPC,
    ),
  ]);
  const onboarding = onboardingRows[0];
  if (
    onboarding === undefined ||
    onboarding.status !== "in_progress" ||
    privateDocuments.some((document) =>
      document.onboarding_id === onboarding.onboarding_id &&
      document.source === "generated" &&
      document.title === QUESTIONNAIRE_TITLE
    )
  ) {
    return;
  }

  await ensureQuestionnaireDocument(
    adminClient,
    userClient,
    payload,
    questionnaire,
  );
}
