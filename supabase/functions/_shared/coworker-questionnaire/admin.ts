import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  RPC,
  type AdminQuestionnaireResponse,
  type QuestionnairePayload,
} from "./contracts.ts";
import { loadQuestionnaireCryptoKeys } from "./crypto.ts";
import { parseAdminQuestionnaireRequest } from "./parse-admin-request.ts";
import {
  getAdminQuestionnaireEnvelope,
  getQuestionnaireStatement,
} from "./rpc.ts";
import {
  buildSensitiveMetadata,
  emptySensitiveMetadata,
  redactSensitiveValues,
} from "./sensitive.ts";
import { readStoredQuestionnairePayload } from "./stored-payload.ts";

export async function getAdminQuestionnaire(
  client: SupabaseClient,
  actorUserId: string,
  body: unknown,
): Promise<AdminQuestionnaireResponse> {
  const request = parseAdminQuestionnaireRequest(body);
  const [envelope, statement] = await Promise.all([
    getAdminQuestionnaireEnvelope(
      client,
      request.userId,
      actorUserId,
      request.scope,
      request.purpose,
    ),
    getQuestionnaireStatement(client, actorUserId),
  ]);

  let payload: QuestionnairePayload | null = null;
  if (envelope !== null) {
    const keys = await loadQuestionnaireCryptoKeys();
    payload = await readStoredQuestionnairePayload(
      envelope,
      request.userId,
      keys,
      RPC.getAdminEnvelope,
    );
  }

  const questionnaire = {
    userId: request.userId,
    configured: envelope !== null,
    revision: envelope?.revision ?? null,
    complete: envelope?.isComplete ?? false,
    validationPassed: envelope?.validationPassed ?? false,
    completedAt: envelope?.completedAt ?? null,
    updatedAt: envelope?.updatedAt ?? null,
    sensitive: payload === null
      ? emptySensitiveMetadata()
      : buildSensitiveMetadata(payload),
    statement,
    currentDeclaration: envelope?.currentDeclaration ?? null,
  };

  if (request.scope === "masked") {
    return {
      ok: true,
      action: request.action,
      scope: "masked",
      purpose: request.purpose,
      questionnaire: {
        ...questionnaire,
        data: payload === null ? null : redactSensitiveValues(payload),
      },
    };
  }

  return {
    ok: true,
    action: request.action,
    scope: "full",
    purpose: request.purpose,
    questionnaire: { ...questionnaire, data: payload },
  };
}
