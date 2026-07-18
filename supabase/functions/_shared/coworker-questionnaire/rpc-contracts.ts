import {
  backendBase64,
  backendBoolean,
  backendNullableTimestamp,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendTrue,
  backendUuid,
} from "./backend-reader.ts";
import {
  ENCRYPTION_KEY_VERSION,
  FINAL_STATEMENT_KEY,
  PAYLOAD_SCHEMA_VERSION,
  RPC,
  VALIDATION_SCHEMA_VERSION,
  type CurrentDeclaration,
  type QuestionnaireEnvelope,
  type QuestionnaireStatement,
  type RpcName,
  type SaveEnvelopeInput,
  type SaveEnvelopeResult,
} from "./contracts.ts";
import { BackendContractError } from "./errors.ts";

const STATEMENT_KEYS = [
  "statementKey",
  "statementVersion",
  "statementText",
  "statementSha256Base64",
] as const;
const DECLARATION_KEYS = [
  "id",
  "questionnaireRevision",
  ...STATEMENT_KEYS,
  "actorUserId",
  "source",
  "acceptedAt",
] as const;
const ENVELOPE_KEYS = [
  "userId",
  "ciphertextBase64",
  "ivBase64",
  "encryptionKeyVersion",
  "payloadSchemaVersion",
  "validationSchemaVersion",
  "revision",
  "isComplete",
  "validationPassed",
  "completedAt",
  "validatedAt",
  "updatedAt",
  "currentDeclaration",
] as const;
const SAVE_RESULT_KEYS = [
  "userId",
  "saved",
  "revision",
  "isComplete",
  "validationPassed",
  "completedAt",
  "validatedAt",
  "updatedAt",
  "currentDeclaration",
] as const;

export function parseStatement(value: unknown): QuestionnaireStatement {
  const rpcName = RPC.getStatement;
  const source = backendObject(value, STATEMENT_KEYS, rpcName);
  const statement = parseStatementFields(source, rpcName);
  if (statement.statementKey !== FINAL_STATEMENT_KEY) {
    throw new BackendContractError(rpcName);
  }
  return statement;
}

export function parseEnvelope(
  value: unknown,
  userId: string,
): QuestionnaireEnvelope | null {
  if (value === null) {
    return null;
  }
  const rpcName = RPC.getEnvelope;
  const source = backendObject(value, ENVELOPE_KEYS, rpcName);
  const revision = backendPositiveInteger(source, "revision", rpcName);
  const envelope: QuestionnaireEnvelope = {
    userId: backendUuid(source, "userId", rpcName),
    ciphertextBase64: backendBase64(source, "ciphertextBase64", rpcName),
    ivBase64: backendBase64(source, "ivBase64", rpcName, 12),
    encryptionKeyVersion: backendPositiveInteger(
      source,
      "encryptionKeyVersion",
      rpcName,
    ),
    payloadSchemaVersion: backendPositiveInteger(
      source,
      "payloadSchemaVersion",
      rpcName,
    ),
    validationSchemaVersion: backendPositiveInteger(
      source,
      "validationSchemaVersion",
      rpcName,
    ),
    revision,
    isComplete: backendBoolean(source, "isComplete", rpcName),
    validationPassed: backendBoolean(source, "validationPassed", rpcName),
    completedAt: backendNullableTimestamp(source, "completedAt", rpcName),
    validatedAt: backendNullableTimestamp(source, "validatedAt", rpcName),
    updatedAt: backendTimestamp(source, "updatedAt", rpcName),
    currentDeclaration: parseNullableDeclaration(
      source.currentDeclaration,
      userId,
      revision,
      rpcName,
    ),
  };

  validateEnvelope(envelope, userId, rpcName);
  return envelope;
}

export function parseSaveResult(
  value: unknown,
  input: SaveEnvelopeInput,
  statement: QuestionnaireStatement,
): SaveEnvelopeResult {
  const rpcName = RPC.saveEnvelope;
  const source = backendObject(value, SAVE_RESULT_KEYS, rpcName);
  const revision = backendPositiveInteger(source, "revision", rpcName);
  const result: SaveEnvelopeResult = {
    userId: backendUuid(source, "userId", rpcName),
    saved: backendTrue(source, "saved", rpcName),
    revision,
    isComplete: backendBoolean(source, "isComplete", rpcName),
    validationPassed: backendBoolean(source, "validationPassed", rpcName),
    completedAt: backendNullableTimestamp(source, "completedAt", rpcName),
    validatedAt: backendNullableTimestamp(source, "validatedAt", rpcName),
    updatedAt: backendTimestamp(source, "updatedAt", rpcName),
    currentDeclaration: parseNullableDeclaration(
      source.currentDeclaration,
      input.userId,
      revision,
      rpcName,
    ),
  };

  if (
    result.userId !== input.userId ||
    result.validationPassed !== input.validationPassed ||
    result.isComplete !== input.isComplete
  ) {
    throw new BackendContractError(rpcName);
  }
  validateCompletionEvidence(result, statement, rpcName);
  return result;
}

function parseNullableDeclaration(
  value: unknown,
  userId: string,
  revision: number,
  rpcName: RpcName,
): CurrentDeclaration | null {
  if (value === null) {
    return null;
  }
  const source = backendObject(value, DECLARATION_KEYS, rpcName);
  const declaration: CurrentDeclaration = {
    id: backendUuid(source, "id", rpcName),
    questionnaireRevision: backendPositiveInteger(
      source,
      "questionnaireRevision",
      rpcName,
    ),
    ...parseStatementFields(source, rpcName),
    actorUserId: backendUuid(source, "actorUserId", rpcName),
    source: readWebSource(source.source, rpcName),
    acceptedAt: backendTimestamp(source, "acceptedAt", rpcName),
  };
  if (
    declaration.questionnaireRevision !== revision ||
    declaration.actorUserId !== userId ||
    declaration.statementKey !== FINAL_STATEMENT_KEY
  ) {
    throw new BackendContractError(rpcName);
  }
  return declaration;
}

function parseStatementFields(
  source: { [key: string]: unknown },
  rpcName: RpcName,
): QuestionnaireStatement {
  const statement: QuestionnaireStatement = {
    statementKey: backendString(source, "statementKey", rpcName),
    statementVersion: backendPositiveInteger(
      source,
      "statementVersion",
      rpcName,
    ),
    statementText: backendString(source, "statementText", rpcName),
    statementSha256Base64: backendBase64(
      source,
      "statementSha256Base64",
      rpcName,
      32,
    ),
  };
  if (statement.statementText.trim() === "") {
    throw new BackendContractError(rpcName);
  }
  return statement;
}

function validateEnvelope(
  envelope: QuestionnaireEnvelope,
  userId: string,
  rpcName: RpcName,
): void {
  if (
    envelope.userId !== userId ||
    envelope.encryptionKeyVersion !== ENCRYPTION_KEY_VERSION ||
    envelope.payloadSchemaVersion !== PAYLOAD_SCHEMA_VERSION ||
    envelope.validationSchemaVersion !== VALIDATION_SCHEMA_VERSION ||
    envelope.validationPassed !== envelope.isComplete ||
    (envelope.isComplete !== (envelope.completedAt !== null)) ||
    (envelope.isComplete !== (envelope.validatedAt !== null)) ||
    (envelope.isComplete !== (envelope.currentDeclaration !== null)) ||
    (envelope.currentDeclaration !== null &&
      envelope.currentDeclaration.questionnaireRevision !== envelope.revision)
  ) {
    throw new BackendContractError(rpcName);
  }
}

function validateCompletionEvidence(
  result: SaveEnvelopeResult,
  statement: QuestionnaireStatement,
  rpcName: RpcName,
): void {
  if (
    result.validationPassed !== result.isComplete ||
    result.isComplete !== (result.completedAt !== null) ||
    result.isComplete !== (result.validatedAt !== null) ||
    result.isComplete !== (result.currentDeclaration !== null) ||
    (result.currentDeclaration !== null &&
      result.currentDeclaration.questionnaireRevision !== result.revision)
  ) {
    throw new BackendContractError(rpcName);
  }
  const declaration = result.currentDeclaration;
  if (
    declaration !== null &&
    (
      declaration.statementKey !== statement.statementKey ||
      declaration.statementVersion !== statement.statementVersion ||
      declaration.statementText !== statement.statementText ||
      declaration.statementSha256Base64 !== statement.statementSha256Base64
    )
  ) {
    throw new BackendContractError(rpcName);
  }
}

function readWebSource(value: unknown, rpcName: RpcName): "web" {
  if (value !== "web") {
    throw new BackendContractError(rpcName);
  }
  return value;
}
