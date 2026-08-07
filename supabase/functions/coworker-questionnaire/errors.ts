import {
  BackendContractError,
  CryptoConfigurationError,
  CryptoOperationError,
  loggedErrorResponse,
  questionnaireHttpErrorResponse,
  QuestionnaireDocumentStorageError,
  QuestionnaireOnboardingStateError,
  QuestionnairePdfGenerationError,
  QuestionnaireValidationError,
  rpcError,
  RpcCallError,
} from "../_shared/coworker-questionnaire/errors.ts";
import { CoworkerDocumentRpcError } from "../_shared/coworker-documents.ts";

const ALLOWED_METHODS = "GET, PUT";

export function createErrorResponse(
  error: unknown,
  requestId: string,
): Response {
  if (error instanceof QuestionnaireValidationError) {
    return loggedErrorResponse(
      400,
      "VALIDATION_FAILED",
      "Questionnaire validation failed.",
      requestId,
      { fieldErrors: error.fieldErrors },
    );
  }
  const httpResponse = questionnaireHttpErrorResponse(
    error,
    requestId,
    ALLOWED_METHODS,
  );
  if (httpResponse !== null) return httpResponse;
  if (error instanceof RpcCallError) {
    return rpcErrorResponse(error, requestId);
  }
  if (error instanceof CoworkerDocumentRpcError) {
    return documentRpcErrorResponse(error, requestId);
  }
  if (error instanceof CryptoConfigurationError) {
    return loggedErrorResponse(
      500,
      "FUNCTION_CONFIGURATION_ERROR",
      "The questionnaire service is not configured correctly.",
      requestId,
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
  if (error instanceof QuestionnairePdfGenerationError) {
    return loggedErrorResponse(
      500,
      "QUESTIONNAIRE_PDF_GENERATION_FAILED",
      "The questionnaire document could not be generated.",
      requestId,
    );
  }
  if (error instanceof QuestionnaireDocumentStorageError) {
    return loggedErrorResponse(
      500,
      "QUESTIONNAIRE_DOCUMENT_STORAGE_FAILED",
      "The questionnaire document could not be stored.",
      requestId,
    );
  }
  if (error instanceof QuestionnaireOnboardingStateError) {
    return loggedErrorResponse(
      400,
      "QUESTIONNAIRE_STATE_INVALID",
      "An in-progress onboarding is required.",
      requestId,
    );
  }
  if (error instanceof BackendContractError) {
    return loggedErrorResponse(
      500,
      "BACKEND_CONTRACT_ERROR",
      "The questionnaire service returned an invalid response.",
      requestId,
      undefined,
      error.rpcName,
    );
  }
  return loggedErrorResponse(
    500,
    "INTERNAL_ERROR",
    "The questionnaire service is unavailable.",
    requestId,
  );
}

function rpcErrorResponse(
  error: RpcCallError,
  requestId: string,
): Response {
  switch (error.sqlState) {
    case "42501":
      return rpcError(
        403,
        "COWORKER_ACCESS_DENIED",
        "Active coworker access is required.",
        error,
        requestId,
      );
    case "23505":
      return rpcError(
        409,
        "PESEL_CONFLICT",
        "PESEL is already assigned to another questionnaire.",
        error,
        requestId,
      );
    case "40001":
      return rpcError(
        409,
        "CONCURRENT_MODIFICATION",
        "The questionnaire changed concurrently. Reload and retry.",
        error,
        requestId,
      );
    case "P0002":
      return rpcError(
        404,
        "QUESTIONNAIRE_RESOURCE_NOT_FOUND",
        "The requested questionnaire resource was not found.",
        error,
        requestId,
      );
    case "22023":
    case "22P02":
    case "22007":
    case "23514":
      return rpcError(
        400,
        "QUESTIONNAIRE_STATE_INVALID",
        "The questionnaire request is invalid for the current state.",
        error,
        requestId,
      );
    default:
      return rpcError(
        500,
        "BACKEND_ERROR",
        "The questionnaire service is unavailable.",
        error,
        requestId,
      );
  }
}

function documentRpcErrorResponse(
  error: CoworkerDocumentRpcError,
  requestId: string,
): Response {
  switch (error.sqlState) {
    case "42501":
      if (error.rpcName !== "register_questionnaire_private_document") {
        return rpcError(
          403,
          "COWORKER_ACCESS_DENIED",
          "Active coworker access is required.",
          error,
          requestId,
        );
      }
      return rpcError(
        500,
        "FUNCTION_CONFIGURATION_ERROR",
        "The questionnaire service is not configured correctly.",
        error,
        requestId,
      );
    case "22023":
      return rpcError(
        400,
        "QUESTIONNAIRE_STATE_INVALID",
        "The questionnaire request is invalid for the current state.",
        error,
        requestId,
      );
    case "P0002":
      return rpcError(
        404,
        "QUESTIONNAIRE_RESOURCE_NOT_FOUND",
        "The requested questionnaire resource was not found.",
        error,
        requestId,
      );
    case "23514":
    case "23505":
      return rpcError(
        409,
        "QUESTIONNAIRE_DOCUMENT_CONFLICT",
        "The questionnaire document conflicts with the current state.",
        error,
        requestId,
      );
    default:
      return rpcError(
        500,
        "BACKEND_ERROR",
        "The questionnaire service is unavailable.",
        error,
        requestId,
      );
  }
}
