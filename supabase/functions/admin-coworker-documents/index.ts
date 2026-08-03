import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { parseAdminDocumentActionRequest, RPC } from "./contracts.ts";
import { handleAdminDocumentDeletionAction } from "./document-deletion-actions.ts";
import {
  isAdminDocumentDeletionAction,
  parseAdminDocumentDeletionAction,
} from "./document-deletion-request.ts";
import { parseAdminDashboard } from "./document-response-contracts.ts";
import {
  acceptDocument,
  createDownloadUrl,
  getReviewDetail,
  rejectDocument,
  startReview,
  verifySignature,
} from "./document-review-actions.ts";
import {
  assignRequirement,
  ensureOnboarding,
  saveDefinition,
  seedDefaultRequirements,
} from "./document-setup-actions.ts";
import {
  createErrorResponse,
  InvalidJsonError,
  MissingUserClaimsError,
} from "./errors.ts";
import { handleSigningPackageReviewAction } from "./signing-package-review-actions.ts";
import {
  isSigningPackageReviewAction,
  parseSigningPackageReviewActionRequest,
} from "./signing-package-review-request.ts";
import { handleSigningSourceAction } from "./signing-source-actions.ts";
import {
  isSigningSourceAction,
  parseSigningSourceActionRequest,
} from "./signing-source-request.ts";
import { handleSigningPackageAction } from "./signing-package-actions.ts";
import {
  isSigningPackageAction,
  parseSigningPackageActionRequest,
} from "./signing-package-request.ts";

const ALLOWED_METHODS = "GET, POST, OPTIONS";

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    const requestId = crypto.randomUUID();

    try {
      const actorUserId = context.userClaims?.id;
      if (actorUserId === undefined) {
        throw new MissingUserClaimsError();
      }

      switch (request.method) {
        case "GET":
          return await handleGet(context.supabaseAdmin, actorUserId);
        case "POST":
          return await handlePost(
            request,
            context.supabaseAdmin,
            actorUserId,
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

async function handleGet(
  client: SupabaseClient,
  actorUserId: string,
): Promise<Response> {
  const [catalogData, reviewQueueData] = await Promise.all([
    callRpc(client, RPC.getCatalog, {
      p_actor_user_id: actorUserId,
    }),
    callRpc(client, RPC.getReviewQueue, {
      p_actor_user_id: actorUserId,
    }),
  ]);

  return Response.json({
    ok: true,
    ...parseAdminDashboard(catalogData, reviewQueueData),
  });
}

async function handlePost(
  request: Request,
  client: SupabaseClient,
  actorUserId: string,
  requestId: string,
): Promise<Response> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    throw new InvalidJsonError();
  }

  if (isSigningSourceAction(body)) {
    return await handleSigningSourceAction(
      client,
      actorUserId,
      parseSigningSourceActionRequest(body),
    );
  }

  if (isSigningPackageAction(body)) {
    return await handleSigningPackageAction(
      client,
      actorUserId,
      parseSigningPackageActionRequest(body),
    );
  }

  if (isSigningPackageReviewAction(body)) {
    return await handleSigningPackageReviewAction(
      client,
      actorUserId,
      parseSigningPackageReviewActionRequest(body),
    );
  }

  if (isAdminDocumentDeletionAction(body)) {
    return await handleAdminDocumentDeletionAction(
      client,
      actorUserId,
      parseAdminDocumentDeletionAction(body),
      requestId,
    );
  }

  const action = parseAdminDocumentActionRequest(body);

  switch (action.action) {
    case "getReviewDetail":
      return await getReviewDetail(client, actorUserId, action, requestId);
    case "saveDefinition":
      return await saveDefinition(client, actorUserId, action);
    case "ensureOnboarding":
      return await ensureOnboarding(client, actorUserId, action);
    case "seedDefaultRequirements":
      return await seedDefaultRequirements(client, actorUserId, action);
    case "assignRequirement":
      return await assignRequirement(client, actorUserId, action);
    case "startReview":
      return await startReview(client, actorUserId, action);
    case "verifySignature":
      return await verifySignature(client, actorUserId, action);
    case "acceptDocument":
      return await acceptDocument(client, actorUserId, action);
    case "rejectDocument":
      return await rejectDocument(client, actorUserId, action);
    case "downloadDocumentVersion":
      return await createDownloadUrl(client, actorUserId, action);
  }
}
