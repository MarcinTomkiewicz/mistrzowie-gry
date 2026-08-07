import { jsonNoStore } from "../http.ts";
import type { FieldErrors } from "./contracts.ts";
import type { RpcName } from "./rpc-names.ts";

export class InvalidJsonError extends Error {
  constructor() {
    super("Invalid JSON.");
    this.name = "InvalidJsonError";
  }
}

export class MissingUserClaimsError extends Error {
  constructor() {
    super("Authenticated user claims are missing.");
    this.name = "MissingUserClaimsError";
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Method not allowed.");
    this.name = "MethodNotAllowedError";
  }
}

export class QuestionnaireValidationError extends Error {
  constructor(readonly fieldErrors: FieldErrors) {
    super("Questionnaire validation failed.");
    this.name = "QuestionnaireValidationError";
  }
}

export class BackendContractError extends Error {
  constructor(readonly rpcName: RpcName | null = null) {
    super("Questionnaire backend contract validation failed.");
    this.name = "BackendContractError";
  }
}

export class RpcCallError extends Error {
  constructor(
    readonly rpcName: RpcName,
    readonly sqlState: string | null,
    readonly databaseMessage: string | null,
    readonly databaseDetails: string | null,
  ) {
    super("Questionnaire RPC call failed.");
    this.name = "RpcCallError";
  }
}

export class CryptoConfigurationError extends Error {
  constructor() {
    super("Invalid questionnaire cryptographic configuration.");
    this.name = "CryptoConfigurationError";
  }
}

export class CryptoOperationError extends Error {
  constructor() {
    super("Questionnaire cryptographic operation failed.");
    this.name = "CryptoOperationError";
  }
}

export class QuestionnairePdfGenerationError extends Error {
  constructor() {
    super("Questionnaire PDF generation failed.");
    this.name = "QuestionnairePdfGenerationError";
  }
}

export class QuestionnaireDocumentStorageError extends Error {
  constructor() {
    super("Questionnaire document Storage upload failed.");
    this.name = "QuestionnaireDocumentStorageError";
  }
}

export class QuestionnaireOnboardingStateError extends Error {
  constructor() {
    super("Questionnaire requires an in-progress onboarding.");
    this.name = "QuestionnaireOnboardingStateError";
  }
}

export function questionnaireHttpErrorResponse(
  error: unknown,
  requestId: string,
  allowedMethods: string,
): Response | null {
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
  if (error instanceof MethodNotAllowedError) {
    return loggedErrorResponse(
      405,
      "METHOD_NOT_ALLOWED",
      "Method not allowed.",
      requestId,
      undefined,
      undefined,
      { Allow: allowedMethods },
    );
  }
  return null;
}

export function loggedErrorResponse(
  status: number,
  code: string,
  message: string,
  requestId: string,
  extra?: Record<string, unknown>,
  rpcName?: string | null,
  headers?: HeadersInit,
): Response {
  const logEntry: Record<string, unknown> = { code, requestId, status };
  if (rpcName !== undefined && rpcName !== null) {
    logEntry["rpcName"] = rpcName;
  }
  console.error(JSON.stringify(logEntry));

  return jsonNoStore(
    { ok: false, code, message, ...(extra ?? {}) },
    { status, headers },
  );
}

export function rpcError(
  status: number,
  code: string,
  message: string,
  error: Readonly<Record<"rpcName", string>>,
  requestId: string,
): Response {
  return loggedErrorResponse(
    status,
    code,
    message,
    requestId,
    undefined,
    error.rpcName,
  );
}
