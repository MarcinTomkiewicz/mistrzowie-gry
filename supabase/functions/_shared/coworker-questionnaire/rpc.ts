import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  ENCRYPTION_KEY_VERSION,
  PAYLOAD_SCHEMA_VERSION,
  VALIDATION_SCHEMA_VERSION,
  type AdminQuestionnairePurpose,
  type AdminQuestionnaireScope,
  type QuestionnaireEnvelope,
  type QuestionnaireStatement,
  type SaveEnvelopeInput,
  type SaveEnvelopeResult,
} from "./contracts.ts";
import { RpcCallError } from "./errors.ts";
import { RPC, type RpcName } from "./rpc-names.ts";
import {
  parseEnvelope,
  parseSaveResult,
  parseStatement,
} from "./rpc-contracts.ts";
import { validateStatementIntegrity } from "./statements.ts";

export async function getQuestionnaireEnvelope(
  client: SupabaseClient,
  userId: string,
): Promise<QuestionnaireEnvelope | null> {
  const data = await callRpc(client, RPC.getEnvelope, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_purpose: "edit",
  });
  return parseQuestionnaireEnvelope(data, userId, RPC.getEnvelope);
}

export async function getAdminQuestionnaireEnvelope(
  client: SupabaseClient,
  userId: string,
  actorUserId: string,
  scope: AdminQuestionnaireScope,
  purpose: AdminQuestionnairePurpose,
): Promise<QuestionnaireEnvelope | null> {
  const data = await callRpc(client, RPC.getAdminEnvelope, {
    p_user_id: userId,
    p_actor_user_id: actorUserId,
    p_scope: scope,
    p_purpose: purpose,
  });
  return parseQuestionnaireEnvelope(data, userId, RPC.getAdminEnvelope);
}

async function parseQuestionnaireEnvelope(
  data: unknown,
  userId: string,
  rpcName: RpcName,
): Promise<QuestionnaireEnvelope | null> {
  const envelope = parseEnvelope(data, userId, rpcName);
  if (envelope !== null && envelope.currentDeclaration !== null) {
    await validateStatementIntegrity(
      envelope.currentDeclaration,
      rpcName,
    );
  }
  return envelope;
}

export async function getQuestionnaireStatement(
  client: SupabaseClient,
  userId: string,
): Promise<QuestionnaireStatement> {
  const data = await callRpc(client, RPC.getStatement, {
    p_actor_user_id: userId,
  });
  const statement = parseStatement(data);
  await validateStatementIntegrity(statement, RPC.getStatement);
  return statement;
}

export async function saveQuestionnaireEnvelope(
  client: SupabaseClient,
  input: SaveEnvelopeInput,
  statement: QuestionnaireStatement,
): Promise<SaveEnvelopeResult> {
  const data = await callRpc(client, RPC.saveEnvelope, {
    p_payload: {
      userId: input.userId,
      actorUserId: input.userId,
      expectedRevision: input.expectedRevision,
      ciphertextBase64: input.ciphertextBase64,
      ivBase64: input.ivBase64,
      encryptionKeyVersion: ENCRYPTION_KEY_VERSION,
      payloadSchemaVersion: PAYLOAD_SCHEMA_VERSION,
      validationSchemaVersion: VALIDATION_SCHEMA_VERSION,
      peselHmacBase64: input.peselHmacBase64,
      peselLast4: input.peselLast4,
      identityDocumentLast4: input.identityDocumentLast4,
      bankAccountLast4: input.bankAccountLast4,
      validationPassed: input.validationPassed,
      isComplete: input.isComplete,
      finalDeclaration: input.finalDeclaration,
    },
  });
  const result = parseSaveResult(data, input, statement);
  if (result.currentDeclaration !== null) {
    await validateStatementIntegrity(
      result.currentDeclaration,
      RPC.saveEnvelope,
    );
  }
  return result;
}

export async function callRpc(
  client: SupabaseClient,
  rpcName: RpcName,
  parameters: { [key: string]: unknown },
): Promise<unknown> {
  const { data, error } = await client.rpc(rpcName, parameters);
  if (error !== null) {
    throw new RpcCallError(
      rpcName,
      error.code ?? null,
      error.message ?? null,
      error.details ?? null,
    );
  }
  return data;
}
