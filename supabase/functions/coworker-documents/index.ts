import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  getDocumentPortal,
  handleDocumentCommandAction,
} from "./document-actions.ts";
import { parseDocumentActionRequest } from "./document-request.ts";
import {
  createErrorResponse,
  InvalidJsonError,
  MissingUserClaimsError,
} from "./errors.ts";
import { handleCoworkerSigningPackageAction } from "./signing-package-actions.ts";
import {
  isCoworkerSigningPackageAction,
  parseCoworkerSigningPackageActionRequest,
} from "./signing-package-request.ts";
import { handleDocumentUploadAction } from "./upload-actions.ts";

const ALLOWED_METHODS = "GET, POST, OPTIONS";

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const requestId = crypto.randomUUID();

    try {
      const userId = context.userClaims?.id;
      if (userId === undefined) {
        throw new MissingUserClaimsError();
      }

      switch (request.method) {
        case "GET":
          return await getDocumentPortal(context.supabaseAdmin, userId);
        case "POST":
          return await handlePost(
            request,
            context.supabaseAdmin,
            userId,
            requestId,
          );
        default:
          return Response.json(
            {
              ok: false,
              code: "METHOD_NOT_ALLOWED",
              message: "Method not allowed.",
            },
            {
              status: 405,
              headers: { Allow: ALLOWED_METHODS },
            },
          );
      }
    } catch (error) {
      return createErrorResponse(error, requestId);
    }
  }),
};

async function handlePost(
  request: Request,
  client: SupabaseClient,
  userId: string,
  requestId: string,
): Promise<Response> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    throw new InvalidJsonError();
  }

  if (isCoworkerSigningPackageAction(body)) {
    return await handleCoworkerSigningPackageAction(
      client,
      userId,
      parseCoworkerSigningPackageActionRequest(body),
      requestId,
    );
  }

  const action = parseDocumentActionRequest(body);
  if (
    action.action === "reserveUpload" ||
    action.action === "finalizeUpload" ||
    action.action === "cancelUpload"
  ) {
    return await handleDocumentUploadAction(
      client,
      userId,
      action,
      requestId,
    );
  }
  return await handleDocumentCommandAction(client, userId, action);
}
