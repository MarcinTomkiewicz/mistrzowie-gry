import {
  BackendContractError,
  CryptoConfigurationError,
  CryptoOperationError,
  loggedErrorResponse,
  questionnaireHttpErrorResponse,
  QuestionnaireValidationError,
  rpcError,
  RpcCallError,
} from "../_shared/coworker-questionnaire/errors.ts";

const ALLOWED_METHODS = "POST";

export function createErrorResponse(
  error: unknown,
  requestId: string,
): Response {
  if (error instanceof QuestionnaireValidationError) {
    return loggedErrorResponse(
      400,
      "VALIDATION_FAILED",
      "Questionnaire request validation failed.",
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

function rpcErrorResponse(error: RpcCallError, requestId: string): Response {
  switch (error.sqlState) {
    case "42501":
      return error.databaseMessage?.includes("Admin privileges") === true
        ? rpcError(
          403,
          "ADMIN_ACCESS_DENIED",
          "Administrator access is required.",
          error,
          requestId,
        )
        : rpcError(
          403,
          "COWORKER_ACCESS_DENIED",
          "Coworker questionnaire access is denied.",
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
