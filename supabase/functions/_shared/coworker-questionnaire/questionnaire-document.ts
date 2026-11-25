import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { COWORKER_DOCUMENT_PDF_MIME_TYPE } from "../../../../src/app/core/configs/coworker-document.config.ts";
import type {
  IRegisterQuestionnairePrivateDocumentResult,
} from "../../../../src/app/core/interfaces/i-admin-coworker-onboarding.ts";
import type {
  ICoworkerOnboardingRow,
  ICoworkerPrivateDocumentRow,
} from "../../../../src/app/core/interfaces/i-coworker-onboarding.ts";
import { coworkerPdfStorage } from "../coworker-documents.ts";
import {
  readDocumentRpc,
  readSingleDocumentRpc,
  shouldCompensateDocumentRegistration,
} from "../document-api.ts";
import { DocumentStorageError } from "../private-pdf-storage.ts";
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

export async function ensureQuestionnaireDocument(
  adminClient: SupabaseClient,
  userClient: SupabaseClient,
  payload: QuestionnairePayload,
  questionnaire: Pick<
    SaveEnvelopeResult,
    "isComplete" | "validationPassed" | "currentDeclaration"
  >,
  resolvedOnboarding?: ICoworkerOnboardingRow,
): Promise<void> {
  if (
    !questionnaire.isComplete ||
    !questionnaire.validationPassed ||
    questionnaire.currentDeclaration === null
  ) {
    throw new BackendContractError(RPC.saveEnvelope);
  }

  const onboarding = resolvedOnboarding ??
    (await readDocumentRpc<ICoworkerOnboardingRow[]>(
      GET_ONBOARDING_RPC,
      userClient.rpc(GET_ONBOARDING_RPC),
    ))[0];
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
    await coworkerPdfStorage.uploadPdf(adminClient, storagePath, pdfBytes);
  } catch (error) {
    if (error instanceof DocumentStorageError) {
      throw new QuestionnaireDocumentStorageError();
    }
    throw error;
  }

  let result: IRegisterQuestionnairePrivateDocumentResult;
  try {
    result = await readSingleDocumentRpc<
      IRegisterQuestionnairePrivateDocumentResult
    >(
      REGISTER_DOCUMENT_RPC,
      adminClient.rpc(REGISTER_DOCUMENT_RPC, {
        p_onboarding_id: onboarding.onboarding_id,
        p_title: QUESTIONNAIRE_TITLE,
        p_storage_path: storagePath,
        p_original_filename: originalFilename,
        p_mime_type: COWORKER_DOCUMENT_PDF_MIME_TYPE,
        p_size_bytes: pdfBytes.byteLength,
        p_questionnaire_revision:
          questionnaire.currentDeclaration.questionnaireRevision,
      }),
    );
  } catch (error) {
    const storagePaths = [storagePath];
    if (
      shouldCompensateDocumentRegistration(error, {
        operation: REGISTER_DOCUMENT_RPC,
        storagePaths,
      })
    ) {
      try {
        await coworkerPdfStorage.removeDocumentPaths(adminClient, storagePaths);
      } catch {
        throw new QuestionnaireDocumentStorageError();
      }
    }
    throw error;
  }

  if (result.replaced_storage_path !== null) {
    try {
      await coworkerPdfStorage.removeDocumentPaths(adminClient, [
        result.replaced_storage_path,
      ]);
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
    readDocumentRpc<ICoworkerOnboardingRow[]>(
      GET_ONBOARDING_RPC,
      userClient.rpc(GET_ONBOARDING_RPC),
    ),
    readDocumentRpc<ICoworkerPrivateDocumentRow[]>(
      LIST_PRIVATE_DOCUMENTS_RPC,
      userClient.rpc(LIST_PRIVATE_DOCUMENTS_RPC),
    ),
  ]);
  const onboarding = onboardingRows[0];
  if (
    onboarding === undefined ||
    onboarding.status !== "in_progress" ||
    privateDocuments.some((document) =>
      document.onboarding_id === onboarding.onboarding_id &&
      document.title === QUESTIONNAIRE_TITLE &&
      document.source === "generated" &&
      document.questionnaire_revision === questionnaire.revision
    )
  ) {
    return;
  }

  await ensureQuestionnaireDocument(
    adminClient,
    userClient,
    payload,
    questionnaire,
    onboarding,
  );
}
