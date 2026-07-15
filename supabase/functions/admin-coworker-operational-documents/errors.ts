import {
  BackendContractError,
  RequestValidationError,
  type RpcName,
} from "./contracts.ts";

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

export class RpcCallError extends Error {
  constructor(
    readonly rpcName: RpcName,
    readonly sqlState: string | null,
  ) {
    super("RPC call failed.");
    this.name = "RpcCallError";
  }
}

export class StorageCallError extends Error {
  constructor(readonly operation: string) {
    super("Storage operation failed.");
    this.name = "StorageCallError";
  }
}

export class UploadedFileValidationError extends Error {
  constructor(readonly reason: string) {
    super("Uploaded file validation failed.");
    this.name = "UploadedFileValidationError";
  }
}

export class StorageCleanupError extends Error {
  constructor(readonly uploadSessionId: string) {
    super("Upload was cancelled, but Storage cleanup failed.");
    this.name = "StorageCleanupError";
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
  switch (error.sqlState) {
    case "42501":
      return loggedErrorResponse(
        403,
        "ADMIN_ACCESS_DENIED",
        "Administrator privileges are required.",
        requestId,
        undefined,
        undefined,
        error.rpcName,
      );
    case "P0002":
      return loggedErrorResponse(
        404,
        "OPERATIONAL_DOCUMENT_NOT_FOUND",
        "The requested operational document resource was not found.",
        requestId,
        undefined,
        undefined,
        error.rpcName,
      );
    case "23505":
    case "23503":
    case "40001":
      return loggedErrorResponse(
        409,
        "OPERATIONAL_DOCUMENT_CONFLICT",
        "The operational document changed concurrently or conflicts with its current state.",
        requestId,
        undefined,
        undefined,
        error.rpcName,
      );
    case "22023":
    case "22P02":
    case "22007":
    case "23514":
      return loggedErrorResponse(
        400,
        "OPERATIONAL_DOCUMENT_STATE_INVALID",
        "The operational document request is invalid for the current state.",
        requestId,
        undefined,
        undefined,
        error.rpcName,
      );
    default:
      return loggedErrorResponse(
        500,
        "BACKEND_ERROR",
        "The admin operational document service is unavailable.",
        requestId,
        undefined,
        undefined,
        error.rpcName,
      );
  }
}

function loggedErrorResponse(
  status: number,
  code: string,
  message: string,
  requestId: string,
  extra?: { [key: string]: unknown },
  storageOperation?: string,
  rpcName?: RpcName | null,
): Response {
  const logEntry: {
    code: string;
    requestId: string;
    rpcName?: RpcName;
    status: number;
    storageOperation?: string;
  } = { code, requestId, status };

  if (rpcName !== undefined && rpcName !== null) {
    logEntry.rpcName = rpcName;
  }
  if (storageOperation !== undefined) {
    logEntry.storageOperation = storageOperation;
  }

  console.error(JSON.stringify(logEntry));

  return Response.json(
    {
      ok: false,
      code,
      message,
      ...(extra ?? {}),
    },
    { status },
  );
}
