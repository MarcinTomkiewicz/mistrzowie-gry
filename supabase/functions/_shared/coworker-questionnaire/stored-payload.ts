import type {
  QuestionnaireEnvelope,
  QuestionnairePayload,
  RpcName,
} from "./contracts.ts";
import {
  decryptQuestionnaire,
  type QuestionnaireCryptoKeys,
} from "./crypto.ts";
import {
  BackendContractError,
  QuestionnaireValidationError,
} from "./errors.ts";
import { parseStoredQuestionnairePayload } from "./parse-questionnaire.ts";
import { validateQuestionnairePayload } from "./validation.ts";

export async function readStoredQuestionnairePayload(
  envelope: QuestionnaireEnvelope,
  userId: string,
  keys: QuestionnaireCryptoKeys,
  rpcName: RpcName,
): Promise<QuestionnairePayload> {
  const decrypted = await decryptQuestionnaire(
    envelope.ciphertextBase64,
    envelope.ivBase64,
    userId,
    keys,
  );

  try {
    const parsed = parseStoredQuestionnairePayload(decrypted);
    return validateQuestionnairePayload(parsed, envelope.isComplete);
  } catch (error) {
    if (error instanceof QuestionnaireValidationError) {
      throw new BackendContractError(rpcName);
    }
    throw error;
  }
}
