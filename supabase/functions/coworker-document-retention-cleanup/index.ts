import {
  createClient,
  type SupabaseClient,
} from "npm:@supabase/supabase-js@^2";

import {
  parseRetentionCleanupRequest,
  type RetentionCleanupRequest,
  RetentionCleanupRequestContractError,
} from "./contracts.ts";
import { logWorkerError, runRetentionCleanup } from "./retention-cleanup.ts";

const ALLOWED_METHODS = "POST";

interface WorkerConfiguration {
  supabaseUrl: string;
  serviceRoleKey: string;
}

class WorkerConfigurationError extends Error {
  constructor() {
    super("Retention cleanup worker configuration is missing.");
    this.name = "WorkerConfigurationError";
  }
}

export default {
  fetch: async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();

    if (request.method !== "POST") {
      return errorResponse(
        405,
        "METHOD_NOT_ALLOWED",
        "Method not allowed.",
        { Allow: ALLOWED_METHODS },
      );
    }

    const configuration = readConfiguration();
    if (configuration === null) {
      logWorkerError(requestId, new WorkerConfigurationError());
      return errorResponse(
        500,
        "WORKER_CONFIGURATION_ERROR",
        "Retention cleanup worker configuration is unavailable.",
      );
    }

    const bearer = readBearer(request.headers.get("Authorization"));
    let authorized = false;
    try {
      authorized = bearer !== null &&
        await matchesServiceRoleKey(bearer, configuration.serviceRoleKey);
    } catch (error) {
      logWorkerError(requestId, error);
      return workerErrorResponse();
    }
    if (!authorized) {
      return errorResponse(
        401,
        "UNAUTHORIZED",
        "Valid worker credentials are required.",
      );
    }

    let body: unknown;
    try {
      body = (await request.json()) as unknown;
    } catch {
      return errorResponse(
        400,
        "INVALID_JSON",
        "Request body must contain valid JSON.",
      );
    }

    let parsedRequest: RetentionCleanupRequest;
    try {
      parsedRequest = parseRetentionCleanupRequest(body);
    } catch (error) {
      if (error instanceof RetentionCleanupRequestContractError) {
        return errorResponse(
          400,
          "INVALID_REQUEST",
          "Retention cleanup request is invalid.",
        );
      }
      logWorkerError(requestId, error);
      return workerErrorResponse();
    }

    let client: SupabaseClient;
    try {
      client = createClient(
        configuration.supabaseUrl,
        configuration.serviceRoleKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        },
      );
    } catch (error) {
      logWorkerError(requestId, error);
      return errorResponse(
        500,
        "WORKER_CONFIGURATION_ERROR",
        "Retention cleanup worker configuration is unavailable.",
      );
    }

    try {
      const response = await runRetentionCleanup(
        client,
        parsedRequest,
        requestId,
      );
      return Response.json(response, {
        status: response.workerErrors === 0 ? 200 : 500,
      });
    } catch (error) {
      logWorkerError(requestId, error);
      return workerErrorResponse();
    }
  },
};

function readConfiguration(): WorkerConfiguration | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (
    typeof supabaseUrl !== "string" ||
    supabaseUrl.trim().length === 0 ||
    typeof serviceRoleKey !== "string" ||
    serviceRoleKey.length === 0
  ) {
    return null;
  }
  return { supabaseUrl, serviceRoleKey };
}

function readBearer(authorization: string | null): string | null {
  if (authorization === null) return null;
  return /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] ?? null;
}

async function matchesServiceRoleKey(
  bearer: string,
  serviceRoleKey: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const [bearerDigest, serviceRoleDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(bearer)),
    crypto.subtle.digest("SHA-256", encoder.encode(serviceRoleKey)),
  ]);
  const bearerBytes = new Uint8Array(bearerDigest);
  const serviceRoleBytes = new Uint8Array(serviceRoleDigest);
  let difference = 0;
  for (let index = 0; index < bearerBytes.length; index += 1) {
    difference |= bearerBytes[index] ^ serviceRoleBytes[index];
  }
  return difference === 0;
}

function workerErrorResponse(): Response {
  return errorResponse(
    500,
    "RETENTION_CLEANUP_WORKER_ERROR",
    "Retention cleanup worker execution failed.",
  );
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  headers?: HeadersInit,
): Response {
  return Response.json({ ok: false, code, message }, { status, headers });
}
