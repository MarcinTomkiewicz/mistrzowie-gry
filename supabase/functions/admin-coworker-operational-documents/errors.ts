import {
  createLoggedErrorResponse as loggedErrorResponse,
  mapRpcError,
  type RpcErrorDomain,
} from "../_shared/coworker-document-edge/error-response.ts";
import { RpcCallError } from "../_shared/coworker-document-edge/rpc.ts";
import { StorageCallError } from "../_shared/coworker-document-edge/signed-storage.ts";
import { StorageCleanupError } from "../_shared/coworker-document-edge/upload-cleanup.ts";
import { BackendContractError, RequestValidationError } from "./contracts.ts";

const OPERATIONAL_DOCUMENT_CONFLICT = {
  status: 409,
  code: "OPERATIONAL_DOCUMENT_CONFLICT",
  message:
    "The operational document changed concurrently or conflicts with its current state.",
} as const;

const OPERATIONAL_RPC_ERRORS: RpcErrorDomain = {
  accessDenied: {
    status: 403,
    code: "ADMIN_ACCESS_DENIED",
    message: "Administrator privileges are required.",
  },
  notFound: {
    status: 404,
    code: "OPERATIONAL_DOCUMENT_NOT_FOUND",
    message: "The requested operational document resource was not found.",
  },
  conflict: OPERATIONAL_DOCUMENT_CONFLICT,
  foreignKeyConflict: OPERATIONAL_DOCUMENT_CONFLICT,
  concurrent: OPERATIONAL_DOCUMENT_CONFLICT,
  invalidState: {
    status: 400,
    code: "OPERATIONAL_DOCUMENT_STATE_INVALID",
    message:
      "The operational document request is invalid for the current state.",
  },
  unavailable: {
    status: 500,
    code: "BACKEND_ERROR",
    message: "The admin operational document service is unavailable.",
  },
};

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
  constructor(readonly reason: string) {
    super("Uploaded file validation failed.");
    this.name = "UploadedFileValidationError";
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
      "Admin operational document request validation failed.",
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
      "The operational document storage service is unavailable.",
      requestId,
      undefined,
      error.operation,
    );
  }

  if (error instanceof BackendContractError) {
    return loggedErrorResponse(
      500,
      "BACKEND_CONTRACT_ERROR",
      "The admin operational document service returned an invalid response.",
      requestId,
      undefined,
      undefined,
      error.rpcName,
    );
  }

  return loggedErrorResponse(
    500,
    "INTERNAL_ERROR",
    "The admin operational document service is unavailable.",
    requestId,
  );
}

function rpcErrorResponse(error: RpcCallError, requestId: string): Response {
  const definition = mapRpcError(error.sqlState, OPERATIONAL_RPC_ERRORS);
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
