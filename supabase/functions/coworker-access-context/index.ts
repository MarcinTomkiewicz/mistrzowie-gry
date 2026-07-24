import { withSupabase } from "npm:@supabase/server@^1";

import { createBackendContractReaders } from "../_shared/coworker-document-edge/backend-contract-readers.ts";
import { createLoggedErrorResponse } from "../_shared/coworker-document-edge/error-response.ts";
import {
  callRpc,
  RpcCallError,
} from "../_shared/coworker-document-edge/rpc.ts";

const ALLOWED_METHODS = "GET, OPTIONS";
const RPC = "get_coworker_access_context";

type RpcName = typeof RPC;

class BackendContractError extends Error {
  constructor(readonly rpcName: RpcName) {
    super("Coworker access context contract validation failed.");
    this.name = "BackendContractError";
  }
}

class MissingUserClaimsError extends Error {
  constructor() {
    super("Authenticated user claims are missing.");
    this.name = "MissingUserClaimsError";
  }
}

const { backendBoolean, backendObject } = createBackendContractReaders<RpcName>(
  {
    createRequestError: () => new Error("Request contract validation failed."),
    createBackendError: (rpcName) => new BackendContractError(rpcName),
  },
);

const authenticatedHandler = withSupabase(
  { auth: "user" },
  async (request, context) => {
    const requestId = crypto.randomUUID();

    if (request.method !== "GET") {
      const response = createLoggedErrorResponse(
        405,
        "METHOD_NOT_ALLOWED",
        "Method not allowed.",
        requestId,
      );
      response.headers.set("Allow", ALLOWED_METHODS);
      return response;
    }

    try {
      const userId = context.userClaims?.id;
      if (typeof userId !== "string" || userId === "") {
        throw new MissingUserClaimsError();
      }

      const data = await callRpc(context.supabaseAdmin, RPC, {
        p_user_id: userId,
      });
      const access = parseAccessContext(data);

      return Response.json({
        ok: true,
        access: {
          enabled: access.enabled,
        },
      });
    } catch (error) {
      return createErrorResponse(error, requestId);
    }
  },
);

export default {
  fetch: async (request: Request): Promise<Response> =>
    withRequiredHeaders(await authenticatedHandler(request)),
};

function parseAccessContext(value: unknown): { enabled: boolean } {
  const source = backendObject(value, RPC, ["enabled"]);
  return {
    enabled: backendBoolean(source, "enabled", RPC),
  };
}

function createErrorResponse(error: unknown, requestId: string): Response {
  if (error instanceof MissingUserClaimsError) {
    return createLoggedErrorResponse(
      401,
      "UNAUTHENTICATED",
      "A valid user session is required.",
      requestId,
    );
  }
  if (error instanceof BackendContractError) {
    return createLoggedErrorResponse(
      500,
      "BACKEND_CONTRACT_ERROR",
      "The coworker access context service returned an invalid response.",
      requestId,
      undefined,
      undefined,
      error.rpcName,
    );
  }
  if (error instanceof RpcCallError) {
    return createLoggedErrorResponse(
      500,
      "BACKEND_ERROR",
      "The coworker access context service is unavailable.",
      requestId,
      undefined,
      undefined,
      error.rpcName,
    );
  }

  return createLoggedErrorResponse(
    500,
    "INTERNAL_ERROR",
    "The coworker access context service is unavailable.",
    requestId,
  );
}

function withRequiredHeaders(response: Response): Response {
  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", "private, no-store");
  result.headers.set("Pragma", "no-cache");
  const vary = result.headers.get("Vary");
  const variesByAuthorization = vary
    ?.split(",")
    .some((value) => value.trim().toLowerCase() === "authorization");
  if (!variesByAuthorization) {
    result.headers.append("Vary", "Authorization");
  }
  return result;
}
