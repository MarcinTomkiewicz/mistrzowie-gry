import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type {
  QuestionnairePayload,
  QuestionnaireStatement,
  SaveEnvelopeInput,
  SaveEnvelopeResult,
} from "./contracts.ts";
import type { QuestionnaireCryptoKeys } from "./crypto.ts";
import { RpcCallError } from "./errors.ts";
import { getQuestionnaireEnvelope, saveQuestionnaireEnvelope } from "./rpc.ts";
import { RPC } from "./rpc-names.ts";
import { readStoredQuestionnairePayload } from "./stored-payload.ts";

export async function saveQuestionnaireWithRecovery(
  client: SupabaseClient,
  input: SaveEnvelopeInput,
  statement: QuestionnaireStatement,
  payload: QuestionnairePayload,
  keys: QuestionnaireCryptoKeys,
): Promise<SaveEnvelopeResult> {
  try {
    return await saveQuestionnaireEnvelope(client, input, statement);
  } catch (error) {
    if (
      !(error instanceof RpcCallError) ||
      error.sqlState !== "40001" ||
      !input.isComplete ||
      input.finalDeclaration === null
    ) {
      throw error;
    }

    const envelope = await getQuestionnaireEnvelope(client, input.userId);
    if (
      envelope === null ||
      !envelope.isComplete ||
      !envelope.validationPassed ||
      envelope.currentDeclaration === null ||
      envelope.currentDeclaration.statementKey !==
        input.finalDeclaration.statementKey ||
      envelope.currentDeclaration.statementVersion !==
        input.finalDeclaration.statementVersion
    ) {
      throw error;
    }

    const storedPayload = await readStoredQuestionnairePayload(
      envelope,
      input.userId,
      keys,
      RPC.getEnvelope,
    );
    if (JSON.stringify(storedPayload) !== JSON.stringify(payload)) {
      throw error;
    }

    return {
      userId: envelope.userId,
      saved: true,
      revision: envelope.revision,
      isComplete: envelope.isComplete,
      validationPassed: envelope.validationPassed,
      completedAt: envelope.completedAt,
      validatedAt: envelope.validatedAt,
      updatedAt: envelope.updatedAt,
      currentDeclaration: envelope.currentDeclaration,
    };
  }
}
