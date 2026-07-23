import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { createSignedDownloadUrl } from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  type AdminDocumentActionRequest,
  parseAdminDashboard,
  parseAdminDocumentActionRequest,
  parseDocumentResult,
  parseDownloadTarget,
  parseOnboardingResult,
  parseRequirementResult,
  parseReviewDetail,
  parseSavedDefinition,
  parseSeedRequirementsResult,
  parseSignatureVerification,
  RPC,
} from "./contracts.ts";
import {
  createErrorResponse,
  InvalidJsonError,
  MissingUserClaimsError,
} from "./errors.ts";
import { handleSigningSourceAction } from "./signing-source-actions.ts";
import {
  isSigningSourceAction,
  parseSigningSourceActionRequest,
} from "./signing-source-request.ts";

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

  const action = parseAdminDocumentActionRequest(body);

  switch (action.action) {
    case "getReviewDetail":
      return await getReviewDetail(client, actorUserId, action);
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

async function getReviewDetail(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "getReviewDetail" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.getReviewDetail, {
    p_user_id: action.userId,
    p_document_id: action.documentId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "getReviewDetail",
    detail: parseReviewDetail(
      data,
      action.userId,
      action.documentId,
    ),
  });
}

async function saveDefinition(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "saveDefinition" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.saveDefinition, {
    p_actor_user_id: actorUserId,
    p_payload: action.definition,
  });

  return Response.json({
    ok: true,
    action: "saveDefinition",
    definition: parseSavedDefinition(data),
  });
}

async function ensureOnboarding(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "ensureOnboarding" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.ensureOnboarding, {
    p_user_id: action.userId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "ensureOnboarding",
    result: parseOnboardingResult(data, action.userId),
  });
}

async function seedDefaultRequirements(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "seedDefaultRequirements" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.seedDefaultRequirements, {
    p_user_id: action.userId,
    p_onboarding_case_id: action.onboardingCaseId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "seedDefaultRequirements",
    result: parseSeedRequirementsResult(
      data,
      action.userId,
      action.onboardingCaseId,
    ),
  });
}

async function assignRequirement(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "assignRequirement" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.assignRequirement, {
    p_actor_user_id: actorUserId,
    p_payload: action.requirement,
  });

  return Response.json({
    ok: true,
    action: "assignRequirement",
    requirement: parseRequirementResult(
      data,
      action.requirement.userId,
    ),
  });
}

async function startReview(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "startReview" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.startReview, {
    p_user_id: action.userId,
    p_document_id: action.documentId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "startReview",
    document: parseDocumentResult(
      data,
      RPC.startReview,
      action.userId,
      action.documentId,
    ),
  });
}

async function verifySignature(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "verifySignature" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.verifySignature, {
    p_user_id: action.userId,
    p_document_id: action.documentId,
    p_document_version_id: action.documentVersionId,
    p_actor_user_id: actorUserId,
    p_verification_status: action.verificationStatus,
    p_reason: action.reason,
  });

  return Response.json({
    ok: true,
    action: "verifySignature",
    verification: parseSignatureVerification(
      data,
      action.userId,
      action.documentId,
      action.documentVersionId,
      action.verificationStatus,
    ),
  });
}

async function acceptDocument(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "acceptDocument" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.acceptDocument, {
    p_user_id: action.userId,
    p_document_id: action.documentId,
    p_actor_user_id: actorUserId,
    p_note: action.note,
  });

  return Response.json({
    ok: true,
    action: "acceptDocument",
    document: parseDocumentResult(
      data,
      RPC.acceptDocument,
      action.userId,
      action.documentId,
    ),
  });
}

async function rejectDocument(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "rejectDocument" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.rejectDocument, {
    p_user_id: action.userId,
    p_document_id: action.documentId,
    p_actor_user_id: actorUserId,
    p_rejection_reason: action.rejectionReason,
    p_note: action.note,
  });

  return Response.json({
    ok: true,
    action: "rejectDocument",
    document: parseDocumentResult(
      data,
      RPC.rejectDocument,
      action.userId,
      action.documentId,
    ),
  });
}

async function createDownloadUrl(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "downloadDocumentVersion" }
  >,
): Promise<Response> {
  const targetData = await callRpc(client, RPC.getDownloadTarget, {
    p_user_id: action.userId,
    p_actor_user_id: actorUserId,
    p_document_version_id: action.documentVersionId,
    p_purpose: action.purpose,
  });

  const target = parseDownloadTarget(
    targetData,
    action.documentVersionId,
    action.purpose,
  );

  const signedUrl = await createSignedDownloadUrl(
    client,
    target,
    target.signedUrlExpiresInSeconds,
    "create_admin_signed_download_url",
  );

  return Response.json({
    ok: true,
    action: "downloadDocumentVersion",
    download: {
      documentId: target.documentId,
      documentVersionId: target.documentVersionId,
      signedUrl,
      expiresInSeconds: target.signedUrlExpiresInSeconds,
      originalFilename: target.originalFilename,
      mimeType: target.mimeType,
      sizeBytes: target.sizeBytes,
      purpose: target.purpose,
    },
  });
}
