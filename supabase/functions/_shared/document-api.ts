import { jsonNoStore } from "./http.ts";
import {
  DocumentStorageError,
  InvalidPdfError,
} from "./private-pdf-storage.ts";

const CONFIRMED_RPC_REJECTION_CODES = new Set([
  "42501",
  "22023",
  "P0002",
  "23503",
  "23505",
  "23514",
  "40001",
  "40P01",
]);

type DocumentWriteOutcomeCode =
  | "UPLOAD_OUTCOME_UNKNOWN"
  | "REGISTRATION_OUTCOME_UNKNOWN"
  | "DELETE_OUTCOME_UNKNOWN";

const POST_COMMIT_STORAGE_CLEANUP_FAILED = "POST_COMMIT_STORAGE_CLEANUP_FAILED";

type DocumentApiErrorCode =
  | "UNAUTHENTICATED"
  | "ACCESS_DENIED"
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UPLOAD_FAILED"
  | "INTERNAL_ERROR"
  | typeof POST_COMMIT_STORAGE_CLEANUP_FAILED
  | DocumentWriteOutcomeCode;

export class DocumentRequestError extends Error {
  constructor() {
    super("Document request validation failed.");
    this.name = "DocumentRequestError";
  }
}

export class DocumentAuthenticationError extends Error {
  constructor() {
    super("Authenticated user claims are missing.");
    this.name = "DocumentAuthenticationError";
  }
}

export class DocumentRpcError extends Error {
  constructor(readonly rpcName: string, readonly sqlState: string | null) {
    super("Document RPC failed.");
    this.name = "DocumentRpcError";
  }
}

export class DocumentNotFoundError extends Error {
  constructor() {
    super("Document resource was not found.");
    this.name = "DocumentNotFoundError";
  }
}

export class DocumentConflictError extends Error {
  constructor() {
    super("Document request conflicts with the current state.");
    this.name = "DocumentConflictError";
  }
}

export class DocumentContractError extends Error {
  constructor() {
    super("Document backend returned an invalid result.");
    this.name = "DocumentContractError";
  }
}

export class DocumentWriteOutcomeUnknownError extends Error {
  constructor(readonly code: DocumentWriteOutcomeCode) {
    super("Document write outcome could not be confirmed.");
    this.name = "DocumentWriteOutcomeUnknownError";
  }
}

export class DocumentPostCommitCleanupError extends Error {
  readonly code = POST_COMMIT_STORAGE_CLEANUP_FAILED;

  constructor() {
    super(
      "Document change committed, but Storage cleanup could not be confirmed.",
    );
    this.name = "DocumentPostCommitCleanupError";
  }
}

export function isConfirmedDocumentRpcRejection(error: unknown): boolean {
  return error instanceof DocumentRpcError && error.sqlState !== null &&
    CONFIRMED_RPC_REJECTION_CODES.has(error.sqlState);
}

export function shouldCompensateDocumentRegistration(
  error: unknown,
  context:
    | { requestId: string; storagePath: string }
    | { operation: string; storagePaths: readonly string[] },
): boolean {
  if (isConfirmedDocumentRpcRejection(error)) return true;
  console.error(
    JSON.stringify({ code: "REGISTRATION_OUTCOME_UNKNOWN", ...context }),
  );
  return false;
}

type RpcResponse<Result> = PromiseLike<{
  data: Result | null;
  error: { code: string } | null;
}>;

export async function readDocumentRpc<Result>(
  rpcName: string,
  query: RpcResponse<Result>,
): Promise<Result> {
  const { data, error } = await query;
  if (error !== null) {
    throw new DocumentRpcError(rpcName, error.code || null);
  }
  if (data === null) throw new DocumentContractError();
  return data;
}

export async function readSingleDocumentRpc<Result>(
  rpcName: string,
  query: RpcResponse<Result[]>,
): Promise<Result> {
  const rows = await readDocumentRpc(rpcName, query);
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0] == null) {
    throw new DocumentContractError();
  }
  return rows[0];
}

export function successResponse(data: unknown): Response {
  return jsonNoStore({ ok: true, data });
}

export async function normalizeDocumentResponse(
  response: Response,
): Promise<Response> {
  if (response.status !== 401 && response.status !== 500) return response;

  let body: unknown;
  try {
    body = await response.clone().json();
  } catch {
    body = null;
  }
  if (typeof body === "object" && body !== null && "ok" in body) {
    return response;
  }

  const normalized = response.status === 401
    ? errorResponse(401, "UNAUTHENTICATED", "A valid user session is required.")
    : errorResponse(500, "INTERNAL_ERROR", "Document service is unavailable.");
  const headers = new Headers(response.headers);
  normalized.headers.forEach((value, key) => headers.set(key, value));
  return new Response(normalized.body, { status: normalized.status, headers });
}

export function documentErrorResponse(
  error: unknown,
  requestId: string,
): Response {
  if (
    error instanceof DocumentRequestError || error instanceof InvalidPdfError
  ) {
    return errorResponse(400, "VALIDATION_FAILED", "Request is invalid.");
  }
  if (error instanceof DocumentAuthenticationError) {
    return errorResponse(
      401,
      "UNAUTHENTICATED",
      "A valid user session is required.",
    );
  }
  if (error instanceof DocumentRpcError) {
    const mapped = mapSqlState(error.sqlState);
    logError(requestId, mapped.code, error, error.rpcName);
    return errorResponse(mapped.status, mapped.code, mapped.message);
  }
  if (error instanceof DocumentNotFoundError) {
    return errorResponse(404, "NOT_FOUND", "Resource was not found.");
  }
  if (error instanceof DocumentConflictError) {
    const { status, code, message } = mapSqlState("23514");
    return errorResponse(status, code, message);
  }
  if (
    error instanceof DocumentWriteOutcomeUnknownError ||
    error instanceof DocumentPostCommitCleanupError
  ) {
    return errorResponse(502, error.code, error.message);
  }
  if (error instanceof DocumentStorageError) {
    logError(requestId, error.code, error);
    if (error.code === "UPLOAD_FAILED") {
      return errorResponse(502, error.code, "Document upload failed.");
    }
  } else {
    logError(requestId, "INTERNAL_ERROR", error);
  }
  return errorResponse(
    500,
    "INTERNAL_ERROR",
    "Document service is unavailable.",
  );
}

function mapSqlState(sqlState: string | null): {
  status: number;
  code: DocumentApiErrorCode;
  message: string;
} {
  switch (sqlState) {
    case "42501":
      return { status: 403, code: "ACCESS_DENIED", message: "Access denied." };
    case "22023":
      return {
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Request is invalid for the current state.",
      };
    case "23514":
    case "40001":
      return {
        status: 409,
        code: "CONFLICT",
        message: "Request conflicts with the current state.",
      };
    case "P0002":
      return {
        status: 404,
        code: "NOT_FOUND",
        message: "Resource was not found.",
      };
    case "23505":
      return { status: 409, code: "CONFLICT", message: "Resource conflict." };
    default:
      return {
        status: 500,
        code: "INTERNAL_ERROR",
        message: "Document service is unavailable.",
      };
  }
}

function errorResponse(
  status: number,
  code: DocumentApiErrorCode,
  message: string,
): Response {
  return jsonNoStore({ ok: false, code, message }, { status });
}

function logError(
  requestId: string,
  code: DocumentApiErrorCode,
  error: unknown,
  rpcName?: string,
): void {
  console.error(JSON.stringify({
    requestId,
    code,
    ...(rpcName === undefined ? {} : { rpcName }),
    errorType: error instanceof Error ? error.name : "UnknownError",
  }));
}
