import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  COWORKER_DOCUMENT_MAX_FILE_SIZE,
  COWORKER_DOCUMENT_PDF_MIME_TYPE,
} from "../../../src/app/core/configs/coworker-document.config.ts";
import type {
  CoworkerDocumentApiErrorCode,
} from "../../../src/app/core/types/coworker-onboarding.ts";
import { CoworkerDocumentRequestError } from "./coworker-documents.schemas.ts";
import { jsonNoStore } from "./http.ts";

const COWORKER_DOCUMENTS_BUCKET = "coworker-documents";
const COWORKER_DOCUMENT_DOWNLOAD_TTL = 300;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d] as const;

export class CoworkerDocumentRpcError extends Error {
  constructor(
    readonly rpcName: string,
    readonly sqlState: string | null,
  ) {
    super("Coworker document RPC failed.");
    this.name = "CoworkerDocumentRpcError";
  }
}

export class CoworkerDocumentAuthenticationError extends Error {
  constructor() {
    super("Authenticated user claims are missing.");
    this.name = "CoworkerDocumentAuthenticationError";
  }
}

export class CoworkerDocumentStorageError extends Error {
  constructor(
    readonly code: Extract<
      CoworkerDocumentApiErrorCode,
      "UPLOAD_FAILED" | "INTERNAL_ERROR"
    >,
  ) {
    super("Coworker document Storage operation failed.");
    this.name = "CoworkerDocumentStorageError";
  }
}

export class CoworkerDocumentNotFoundError extends Error {
  constructor() {
    super("Coworker document resource was not found.");
    this.name = "CoworkerDocumentNotFoundError";
  }
}

class CoworkerDocumentContractError extends Error {
  constructor() {
    super("Coworker document backend returned an invalid result.");
    this.name = "CoworkerDocumentContractError";
  }
}

export async function callCoworkerRpc<Result>(
  client: SupabaseClient,
  rpcName: string,
  parameters: { [key: string]: unknown } = {},
): Promise<Result> {
  const { data, error } = await client.rpc(rpcName, parameters);
  if (error !== null) {
    throw new CoworkerDocumentRpcError(rpcName, error.code ?? null);
  }
  return data;
}

export async function callSingleCoworkerRpc<Result>(
  client: SupabaseClient,
  rpcName: string,
  parameters: { [key: string]: unknown } = {},
): Promise<Result> {
  const rows = await callCoworkerRpc<Result[]>(client, rpcName, parameters);
  if (rows.length !== 1) throw new CoworkerDocumentContractError();
  return rows[0];
}

export async function readPdfFile(file: File): Promise<Uint8Array> {
  if (
    file.size < PDF_MAGIC.length ||
    file.size > COWORKER_DOCUMENT_MAX_FILE_SIZE ||
    file.type !== COWORKER_DOCUMENT_PDF_MIME_TYPE ||
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new CoworkerDocumentRequestError();
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!PDF_MAGIC.every((value, index) => bytes[index] === value)) {
    throw new CoworkerDocumentRequestError();
  }
  return bytes;
}

export async function uploadPdf(
  client: SupabaseClient,
  path: string,
  bytes: Uint8Array,
): Promise<void> {
  const { error } = await client.storage
    .from(COWORKER_DOCUMENTS_BUCKET)
    .upload(path, bytes, {
      contentType: COWORKER_DOCUMENT_PDF_MIME_TYPE,
      upsert: false,
    });
  if (error !== null) {
    throw new CoworkerDocumentStorageError("UPLOAD_FAILED");
  }
}

export async function removeDocumentPaths(
  client: SupabaseClient,
  paths: readonly string[],
): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await client.storage
    .from(COWORKER_DOCUMENTS_BUCKET)
    .remove([...new Set(paths)]);
  if (error !== null) {
    throw new CoworkerDocumentStorageError("INTERNAL_ERROR");
  }
}

export async function createDocumentDownload(
  client: SupabaseClient,
  path: string,
  filename: string,
): Promise<{ url: string; filename: string }> {
  const { data, error } = await client.storage
    .from(COWORKER_DOCUMENTS_BUCKET)
    .createSignedUrl(path, COWORKER_DOCUMENT_DOWNLOAD_TTL, {
      download: filename,
    });
  if (error !== null || data === null || data.signedUrl === "") {
    throw new CoworkerDocumentStorageError("INTERNAL_ERROR");
  }
  return { url: data.signedUrl, filename };
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
    ? errorResponse(
      401,
      "UNAUTHENTICATED",
      "A valid user session is required.",
    )
    : errorResponse(
      500,
      "INTERNAL_ERROR",
      "Document service is unavailable.",
    );
  const headers = new Headers(response.headers);
  normalized.headers.forEach((value, key) => headers.set(key, value));
  return new Response(normalized.body, {
    status: normalized.status,
    headers,
  });
}

export function documentErrorResponse(
  error: unknown,
  requestId: string,
): Response {
  if (error instanceof CoworkerDocumentRequestError) {
    return errorResponse(400, "VALIDATION_FAILED", "Request is invalid.");
  }
  if (error instanceof CoworkerDocumentAuthenticationError) {
    return errorResponse(
      401,
      "UNAUTHENTICATED",
      "A valid user session is required.",
    );
  }
  if (error instanceof CoworkerDocumentRpcError) {
    const mapped = mapSqlState(error.sqlState);
    logError(requestId, mapped.code, error, error.rpcName);
    return errorResponse(mapped.status, mapped.code, mapped.message);
  }
  if (error instanceof CoworkerDocumentNotFoundError) {
    return errorResponse(404, "NOT_FOUND", "Resource was not found.");
  }
  if (error instanceof CoworkerDocumentStorageError) {
    logError(requestId, error.code, error);
    return errorResponse(
      error.code === "UPLOAD_FAILED" ? 502 : 500,
      error.code,
      error.code === "UPLOAD_FAILED"
        ? "Document upload failed."
        : "Document service is unavailable.",
    );
  }
  logError(requestId, "INTERNAL_ERROR", error);
  return errorResponse(
    500,
    "INTERNAL_ERROR",
    "Document service is unavailable.",
  );
}

function mapSqlState(sqlState: string | null): {
  status: number;
  code: CoworkerDocumentApiErrorCode;
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
  code: CoworkerDocumentApiErrorCode,
  message: string,
): Response {
  return jsonNoStore(
    { ok: false, code, message },
    { status },
  );
}

function logError(
  requestId: string,
  code: CoworkerDocumentApiErrorCode,
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
