import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  createPeselHmacBase64,
  CryptoConfigurationError,
  CryptoOperationError,
  decryptQuestionnaire,
  ENCRYPTION_KEY_VERSION,
  encryptQuestionnaire,
  loadQuestionnaireCryptoKeys,
  PAYLOAD_SCHEMA_VERSION,
  type QuestionnaireCryptoKeys,
  VALIDATION_SCHEMA_VERSION,
} from "./crypto.ts";
import {
  buildSensitiveMetadata,
  getSensitiveLast4,
  isSicknessInsuranceChoiceConfirmed,
  mergeSensitiveValues,
  parseQuestionnairePutRequest,
  parseStoredQuestionnairePayload,
  type QuestionnairePayload,
  QuestionnaireValidationError,
  redactSensitiveValues,
  type SensitiveMetadata,
  validateQuestionnairePayload,
} from "./questionnaire.ts";

const GET_ENVELOPE_RPC = "get_coworker_questionnaire_envelope";
const SAVE_ENVELOPE_RPC = "save_coworker_questionnaire_envelope";
const ALLOWED_METHODS = "GET, PUT, OPTIONS";

type RpcName = typeof GET_ENVELOPE_RPC | typeof SAVE_ENVELOPE_RPC;
type UnknownObject = { [key: string]: unknown };

interface QuestionnaireEnvelope {
  userId: string;
  ciphertextBase64: string;
  ivBase64: string;
  encryptionKeyVersion: number;
  payloadSchemaVersion: number;
  validationSchemaVersion: number;
  revision: number;
  isComplete: boolean;
}

class InvalidJsonError extends Error {
  constructor() {
    super("Invalid JSON.");
    this.name = "InvalidJsonError";
  }
}

class MissingUserClaimsError extends Error {
  constructor() {
    super("Authenticated user claims are missing.");
    this.name = "MissingUserClaimsError";
  }
}

class RpcCallError extends Error {
  constructor(
    readonly rpcName: RpcName,
    readonly sqlState: string | null,
  ) {
    super("RPC call failed.");
    this.name = "RpcCallError";
  }
}

class BackendContractError extends Error {
  constructor(readonly rpcName: RpcName | null = null) {
    super("Backend contract validation failed.");
    this.name = "BackendContractError";
  }
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const requestId = crypto.randomUUID();

    try {
      const userId = context.userClaims?.id;
      if (userId === undefined) {
        throw new MissingUserClaimsError();
      }

      switch (request.method) {
        case "GET":
          return await handleGet(context.supabaseAdmin, userId);
        case "PUT":
          return await handlePut(request, context.supabaseAdmin, userId);
        default:
          return Response.json(
            {
              ok: false,
              code: "METHOD_NOT_ALLOWED",
              message: "Method not allowed.",
            },
            {
              status: 405,
              headers: { Allow: ALLOWED_METHODS },
            },
          );
      }
    } catch (error) {
      return createErrorResponse(error, requestId);
    }
  }),
};

async function handleGet(
  client: SupabaseClient,
  userId: string,
): Promise<Response> {
  const envelope = await getEnvelope(client, userId);
  const keys = await loadQuestionnaireCryptoKeys();

  if (envelope === null) {
    return Response.json({
      configured: false,
      revision: null,
      complete: false,
      data: null,
      sensitive: emptySensitiveMetadata(),
    });
  }

  const payload = await decryptEnvelope(envelope, userId, keys);
  return Response.json({
    configured: true,
    revision: envelope.revision,
    complete: envelope.isComplete,
    data: redactSensitiveValues(payload),
    sensitive: buildSensitiveMetadata(payload),
  });
}

async function handlePut(
  request: Request,
  client: SupabaseClient,
  userId: string,
): Promise<Response> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    throw new InvalidJsonError();
  }

  const parsed = parseQuestionnairePutRequest(body);
  const keys = await loadQuestionnaireCryptoKeys();
  let existingPayload: QuestionnairePayload | null = null;

  if (
    parsed.preserveSensitive.pesel ||
    parsed.preserveSensitive.identityDocumentNumber ||
    parsed.preserveSensitive.bankAccount
  ) {
    const existingEnvelope = await getEnvelope(client, userId);
    if (existingEnvelope !== null) {
      existingPayload = await decryptEnvelope(existingEnvelope, userId, keys);
    }
  }

  const mergedPayload = mergeSensitiveValues(
    parsed.data,
    parsed.preserveSensitive,
    existingPayload,
  );
  const payload = validateQuestionnairePayload(mergedPayload, parsed.complete);
  const validationPassed = parsed.complete;
  const sicknessInsuranceChoiceConfirmed = isSicknessInsuranceChoiceConfirmed(
    payload,
  );
  const sensitive = buildSensitiveMetadata(payload);
  const last4 = getSensitiveLast4(payload);
  const peselHmacBase64 = payload.personal.pesel === null
    ? null
    : await createPeselHmacBase64(payload.personal.pesel, keys);
  const encrypted = await encryptQuestionnaire(payload, userId, keys);

  const revision = await saveEnvelope(client, {
    userId,
    ciphertextBase64: encrypted.ciphertextBase64,
    ivBase64: encrypted.ivBase64,
    peselHmacBase64,
    peselLast4: last4.peselLast4,
    identityDocumentLast4: last4.identityDocumentLast4,
    bankAccountLast4: last4.bankAccountLast4,
    validationPassed,
    sicknessInsuranceChoiceConfirmed,
    isComplete: parsed.complete,
  });

  return Response.json({
    saved: true,
    revision,
    complete: parsed.complete,
    validationPassed,
    sensitive,
  });
}

async function getEnvelope(
  client: SupabaseClient,
  userId: string,
): Promise<QuestionnaireEnvelope | null> {
  const { data, error } = await client.rpc(GET_ENVELOPE_RPC, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_purpose: "edit",
  });

  if (error !== null) {
    throw new RpcCallError(GET_ENVELOPE_RPC, error.code ?? null);
  }
  if (data === null) {
    return null;
  }
  if (!isObject(data)) {
    throw new BackendContractError(GET_ENVELOPE_RPC);
  }

  const envelope: QuestionnaireEnvelope = {
    userId: readRpcString(data, "userId", GET_ENVELOPE_RPC),
    ciphertextBase64: readRpcString(data, "ciphertextBase64", GET_ENVELOPE_RPC),
    ivBase64: readRpcString(data, "ivBase64", GET_ENVELOPE_RPC),
    encryptionKeyVersion: readRpcInteger(
      data,
      "encryptionKeyVersion",
      GET_ENVELOPE_RPC,
    ),
    payloadSchemaVersion: readRpcInteger(
      data,
      "payloadSchemaVersion",
      GET_ENVELOPE_RPC,
    ),
    validationSchemaVersion: readRpcInteger(
      data,
      "validationSchemaVersion",
      GET_ENVELOPE_RPC,
    ),
    revision: readRpcInteger(data, "revision", GET_ENVELOPE_RPC),
    isComplete: readRpcBoolean(data, "isComplete", GET_ENVELOPE_RPC),
  };

  if (envelope.userId !== userId || envelope.revision < 1) {
    throw new BackendContractError(GET_ENVELOPE_RPC);
  }

  return envelope;
}

async function decryptEnvelope(
  envelope: QuestionnaireEnvelope,
  userId: string,
  keys: QuestionnaireCryptoKeys,
): Promise<QuestionnairePayload> {
  if (
    envelope.encryptionKeyVersion !== ENCRYPTION_KEY_VERSION ||
    envelope.payloadSchemaVersion !== PAYLOAD_SCHEMA_VERSION ||
    envelope.validationSchemaVersion !== VALIDATION_SCHEMA_VERSION
  ) {
    throw new BackendContractError(GET_ENVELOPE_RPC);
  }

  const decrypted = await decryptQuestionnaire(
    envelope.ciphertextBase64,
    envelope.ivBase64,
    userId,
    keys,
  );

  try {
    const payload = parseStoredQuestionnairePayload(decrypted);
    return validateQuestionnairePayload(payload, envelope.isComplete);
  } catch (error) {
    if (error instanceof QuestionnaireValidationError) {
      throw new BackendContractError(GET_ENVELOPE_RPC);
    }
    throw error;
  }
}

async function saveEnvelope(
  client: SupabaseClient,
  input: {
    userId: string;
    ciphertextBase64: string;
    ivBase64: string;
    peselHmacBase64: string | null;
    peselLast4: string | null;
    identityDocumentLast4: string | null;
    bankAccountLast4: string | null;
    validationPassed: boolean;
    sicknessInsuranceChoiceConfirmed: boolean;
    isComplete: boolean;
  },
): Promise<number> {
  const { data, error } = await client.rpc(SAVE_ENVELOPE_RPC, {
    p_payload: {
      userId: input.userId,
      actorUserId: input.userId,
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
      sicknessInsuranceChoiceConfirmed: input.sicknessInsuranceChoiceConfirmed,
      isComplete: input.isComplete,
    },
  });

  if (error !== null) {
    throw new RpcCallError(SAVE_ENVELOPE_RPC, error.code ?? null);
  }
  if (!isObject(data)) {
    throw new BackendContractError(SAVE_ENVELOPE_RPC);
  }

  const userId = readRpcString(data, "userId", SAVE_ENVELOPE_RPC);
  const saved = readRpcBoolean(data, "saved", SAVE_ENVELOPE_RPC);
  const revision = readRpcInteger(data, "revision", SAVE_ENVELOPE_RPC);
  const isComplete = readRpcBoolean(data, "isComplete", SAVE_ENVELOPE_RPC);
  const validationPassed = readRpcBoolean(
    data,
    "validationPassed",
    SAVE_ENVELOPE_RPC,
  );

  if (
    userId !== input.userId ||
    !saved ||
    revision < 1 ||
    isComplete !== input.isComplete ||
    validationPassed !== input.validationPassed
  ) {
    throw new BackendContractError(SAVE_ENVELOPE_RPC);
  }

  return revision;
}

function createErrorResponse(error: unknown, requestId: string): Response {
  if (error instanceof QuestionnaireValidationError) {
    return loggedErrorResponse(
      400,
      "VALIDATION_FAILED",
      "Questionnaire validation failed.",
      requestId,
      null,
      error.fieldErrors,
    );
  }

  if (error instanceof InvalidJsonError) {
    return loggedErrorResponse(
      400,
      "INVALID_JSON",
      "Request body must contain valid JSON.",
      requestId,
    );
  }

  if (error instanceof MissingUserClaimsError) {
    return loggedErrorResponse(
      401,
      "UNAUTHENTICATED",
      "A valid user session is required.",
      requestId,
    );
  }

  if (error instanceof RpcCallError) {
    if (error.sqlState === "42501") {
      return loggedErrorResponse(
        403,
        "COWORKER_ACCESS_DENIED",
        "Active coworker access is required.",
        requestId,
        error.rpcName,
      );
    }
    if (error.sqlState === "23505") {
      return loggedErrorResponse(
        409,
        "PESEL_CONFLICT",
        "PESEL is already assigned to another questionnaire.",
        requestId,
        error.rpcName,
      );
    }

    return loggedErrorResponse(
      500,
      "BACKEND_ERROR",
      "The questionnaire service is unavailable.",
      requestId,
      error.rpcName,
    );
  }

  if (error instanceof CryptoConfigurationError) {
    return loggedErrorResponse(
      500,
      "FUNCTION_CONFIGURATION_ERROR",
      "The questionnaire service is not configured correctly.",
      requestId,
    );
  }

  if (error instanceof BackendContractError) {
    return loggedErrorResponse(
      500,
      "BACKEND_ERROR",
      "The questionnaire service is unavailable.",
      requestId,
      error.rpcName,
    );
  }

  if (error instanceof CryptoOperationError) {
    return loggedErrorResponse(
      500,
      "CRYPTO_OPERATION_FAILED",
      "The questionnaire service is unavailable.",
      requestId,
    );
  }

  return loggedErrorResponse(
    500,
    "INTERNAL_ERROR",
    "The questionnaire service is unavailable.",
    requestId,
  );
}

function loggedErrorResponse(
  status: number,
  code: string,
  message: string,
  requestId: string,
  rpcName: RpcName | null = null,
  fieldErrors?: { [field: string]: string },
): Response {
  const logEntry: {
    code: string;
    requestId: string;
    rpcName?: RpcName;
    status: number;
  } = { code, requestId, status };
  if (rpcName !== null) {
    logEntry.rpcName = rpcName;
  }
  console.error(JSON.stringify(logEntry));

  return Response.json(
    fieldErrors === undefined
      ? { ok: false, code, message }
      : { ok: false, code, message, fieldErrors },
    { status },
  );
}

function emptySensitiveMetadata(): SensitiveMetadata {
  return {
    pesel: { configured: false, masked: null },
    identityDocumentNumber: { configured: false, masked: null },
    bankAccount: { configured: false, masked: null },
  };
}

function readRpcString(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): string {
  const value = source[key];
  if (typeof value !== "string" || value === "") {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function readRpcInteger(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): number {
  const value = source[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function readRpcBoolean(
  source: UnknownObject,
  key: string,
  rpcName: RpcName,
): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    throw new BackendContractError(rpcName);
  }
  return value;
}

function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
