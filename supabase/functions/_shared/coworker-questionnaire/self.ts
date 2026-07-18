import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  RPC,
  type QuestionnaireGetResponse,
  type QuestionnairePayload,
  type QuestionnairePutResponse,
} from "./contracts.ts";
import {
  createPeselHmacBase64,
  encryptQuestionnaire,
  loadQuestionnaireCryptoKeys,
  type QuestionnaireCryptoKeys,
} from "./crypto.ts";
import { parseQuestionnairePutRequest } from "./parse-questionnaire.ts";
import {
  getQuestionnaireEnvelope,
  getQuestionnaireStatement,
  saveQuestionnaireEnvelope,
} from "./rpc.ts";
import {
  buildSensitiveMetadata,
  emptySensitiveMetadata,
  getSensitiveLast4,
  hasSensitivePreservation,
  mergeSensitiveValues,
  redactSensitiveValues,
} from "./sensitive.ts";
import { validateFinalDeclaration } from "./statements.ts";
import { readStoredQuestionnairePayload } from "./stored-payload.ts";
import { validateQuestionnairePayload } from "./validation.ts";

export async function getSelfQuestionnaire(
  client: SupabaseClient,
  userId: string,
): Promise<QuestionnaireGetResponse> {
  const [envelope, statement] = await Promise.all([
    getQuestionnaireEnvelope(client, userId),
    getQuestionnaireStatement(client, userId),
  ]);

  if (envelope === null) {
    return {
      configured: false,
      revision: null,
      complete: false,
      validationPassed: false,
      completedAt: null,
      updatedAt: null,
      data: null,
      sensitive: emptySensitiveMetadata(),
      statement,
      currentDeclaration: null,
    };
  }

  const keys = await loadQuestionnaireCryptoKeys();
  const payload = await readStoredQuestionnairePayload(
    envelope,
    userId,
    keys,
    RPC.getEnvelope,
  );
  return {
    configured: true,
    revision: envelope.revision,
    complete: envelope.isComplete,
    validationPassed: envelope.validationPassed,
    completedAt: envelope.completedAt,
    updatedAt: envelope.updatedAt,
    data: redactSensitiveValues(payload),
    sensitive: buildSensitiveMetadata(payload),
    statement,
    currentDeclaration: envelope.currentDeclaration,
  };
}

export async function putSelfQuestionnaire(
  client: SupabaseClient,
  userId: string,
  body: unknown,
): Promise<QuestionnairePutResponse> {
  const request = parseQuestionnairePutRequest(body);
  const [keys, statement] = await Promise.all([
    loadQuestionnaireCryptoKeys(),
    getQuestionnaireStatement(client, userId),
  ]);
  validateFinalDeclaration(
    request.complete,
    request.finalDeclaration,
    statement,
  );

  const existing = hasSensitivePreservation(request.preserveSensitive)
    ? await readExistingPayload(client, userId, keys)
    : null;
  const merged = mergeSensitiveValues(
    request.data,
    request.preserveSensitive,
    existing,
  );
  const payload = validateQuestionnairePayload(merged, request.complete);
  const last4 = getSensitiveLast4(payload);
  const peselHmacBase64 = payload.personal.pesel === null
    ? null
    : await createPeselHmacBase64(payload.personal.pesel, keys);
  const encrypted = await encryptQuestionnaire(payload, userId, keys);
  const result = await saveQuestionnaireEnvelope(
    client,
    {
      userId,
      expectedRevision: request.expectedRevision,
      ...encrypted,
      peselHmacBase64,
      ...last4,
      validationPassed: request.complete,
      isComplete: request.complete,
      finalDeclaration: request.finalDeclaration,
    },
    statement,
  );

  return {
    saved: true,
    revision: result.revision,
    complete: result.isComplete,
    validationPassed: result.validationPassed,
    completedAt: result.completedAt,
    updatedAt: result.updatedAt,
    sensitive: buildSensitiveMetadata(payload),
    statement,
    currentDeclaration: result.currentDeclaration,
  };
}

async function readExistingPayload(
  client: SupabaseClient,
  userId: string,
  keys: QuestionnaireCryptoKeys,
): Promise<QuestionnairePayload | null> {
  const envelope = await getQuestionnaireEnvelope(client, userId);
  return envelope === null
    ? null
    : await readStoredQuestionnairePayload(
      envelope,
      userId,
      keys,
      RPC.getEnvelope,
    );
}
