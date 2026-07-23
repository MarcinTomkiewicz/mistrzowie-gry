import {
  createLoggedErrorResponse as loggedErrorResponse,
  mapRpcError,
} from "../_shared/coworker-document-edge/error-response.ts";
import { RpcCallError } from "../_shared/coworker-document-edge/rpc.ts";
import { StorageCallError } from "../_shared/coworker-document-edge/signed-storage.ts";
import { StorageCleanupError } from "../_shared/coworker-document-edge/upload-cleanup.ts";
import { BackendContractError, RequestValidationError } from "./contracts.ts";
import {
  SigningSourceBackendContractError,
  SigningSourceRequestValidationError,
} from "./signing-source-contracts.ts";
import { getRpcErrorDomain } from "./rpc-error-mapping.ts";

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

export class UploadedFileValidationError extends Error {
  constructor(
    readonly reason:
      | "SIZE_MISMATCH"
      | "SHA256_UNAVAILABLE"
      | "SHA256_MISMATCH",
  ) {
    super("Uploaded file validation failed.");
    this.name = "UploadedFileValidationError";
  }
}

export class OnboardingStateInvalidError extends Error {
  constructor() {
    super("The onboarding resource is in an invalid state.");
    this.name = "OnboardingStateInvalidError";
  }
}

export function createErrorResponse(
  error: unknown,
  requestId: string,
): Response {
  if (error instanceof SigningSourceRequestValidationError) {
    return loggedErrorResponse(
      400,
      "VALIDATION_FAILED",
      "Signing source request validation failed.",
      requestId,
      { fieldErrors: error.fieldErrors },
    );
  }

  if (error instanceof RequestValidationError) {
    return loggedErrorResponse(
      400,
      "VALIDATION_FAILED",
      "Admin document request validation failed.",
      requestId,
      { fieldErrors: error.fieldErrors },
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
    return rpcErrorResponse(error, requestId);
  }

  if (error instanceof OnboardingStateInvalidError) {
    return loggedErrorResponse(
      400,
      "ONBOARDING_STATE_INVALID",
      "The signing source operation is invalid for the current state.",
      requestId,
    );
  }

  if (error instanceof UploadedFileValidationError) {
    return loggedErrorResponse(
      422,
      "UPLOADED_FILE_INVALID",
      "The uploaded file does not match the reserved upload contract.",
      requestId,
      { reason: error.reason },
    );
  }

  if (error instanceof StorageCleanupError) {
    return loggedErrorResponse(
      502,
      "STORAGE_CLEANUP_FAILED",
      "The upload was cancelled, but the stored object could not be cleaned up.",
      requestId,
      {
        uploadSessionId: error.uploadSessionId,
        cancelled: true,
        cleanupStatus: "failed",
      },
    );
  }

  if (error instanceof StorageCallError) {
    return loggedErrorResponse(
      502,
      "STORAGE_ERROR",
      "The document storage service is unavailable.",
      requestId,
      undefined,
      error.operation,
    );
  }

  if (error instanceof BackendContractError) {
    return loggedErrorResponse(
      500,
      "BACKEND_CONTRACT_ERROR",
      "The admin document service returned an invalid response.",
      requestId,
      undefined,
      undefined,
      error.rpcName,
    );
  }

  if (error instanceof SigningSourceBackendContractError) {
    return loggedErrorResponse(
      500,
      "BACKEND_CONTRACT_ERROR",
      "The signing source service returned an invalid response.",
      requestId,
      undefined,
      undefined,
      error.rpcName,
    );
  }

  return loggedErrorResponse(
    500,
    "INTERNAL_ERROR",
    "The admin document service is unavailable.",
    requestId,
  );
}

function rpcErrorResponse(
  error: RpcCallError,
  requestId: string,
): Response {
  const definition = mapRpcError(
    error.sqlState,
    getRpcErrorDomain(error.rpcName),
  );

  return loggedErrorResponse(
    definition.status,
    definition.code,
    definition.message,
    requestId,
    undefined,
    undefined,
    error.rpcName,
  );
}
