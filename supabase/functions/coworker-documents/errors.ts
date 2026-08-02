import {
  createLoggedErrorResponse as loggedErrorResponse,
  mapRpcError,
} from "../_shared/coworker-document-edge/error-response.ts";
import { CoworkerDocumentDeletionBackendContractError } from "../_shared/coworker-document-edge/coworker-document-deletion-parser.ts";
import { RpcCallError } from "../_shared/coworker-document-edge/rpc.ts";
import { StorageCallError } from "../_shared/coworker-document-edge/signed-storage.ts";
import { StorageCleanupError } from "../_shared/coworker-document-edge/upload-cleanup.ts";
import {
  BackendContractError,
  RequestValidationError,
} from "./contract-context.ts";
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

export function createErrorResponse(
  error: unknown,
  requestId: string,
): Response {
  if (error instanceof RequestValidationError) {
    return loggedErrorResponse(
      400,
      "VALIDATION_FAILED",
      "Document request validation failed.",
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
    const definition = mapRpcError(
      error.sqlState,
      getRpcErrorDomain(error.rpcName, error.errorContext),
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

  if (
    error instanceof BackendContractError ||
    error instanceof CoworkerDocumentDeletionBackendContractError
  ) {
    return loggedErrorResponse(
      500,
      "BACKEND_CONTRACT_ERROR",
      "The document service returned an invalid response.",
      requestId,
      undefined,
      undefined,
      error.rpcName,
    );
  }

  return loggedErrorResponse(
    500,
    "INTERNAL_ERROR",
    "The document service is unavailable.",
    requestId,
  );
}
