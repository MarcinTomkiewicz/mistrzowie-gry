import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  callRpc,
  RpcCallError,
} from "../_shared/coworker-document-edge/rpc.ts";
import { createSignedDownloadUrl } from "../_shared/coworker-document-edge/signed-storage.ts";
import { type AdminDocumentActionRequest, RPC } from "./contracts.ts";
import { parseDownloadTarget } from "./document-download-response-contract.ts";
import {
  parseDocumentResult,
  parseReviewDetail,
  parseSignatureVerification,
} from "./document-response-contracts.ts";

export async function getReviewDetail(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "getReviewDetail" }
  >,
  requestId: string,
): Promise<Response> {
  let data: unknown;

  try {
    data = await callRpc(client, RPC.getReviewDetail, {
      p_user_id: action.userId,
      p_document_id: action.documentId,
      p_actor_user_id: actorUserId,
    });
  } catch (error: unknown) {
    if (error instanceof RpcCallError) {
      logReviewDetailRpcError(error, requestId, actorUserId, action);
    }
    throw error;
  }

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

function logReviewDetailRpcError(
  error: RpcCallError,
  requestId: string,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "getReviewDetail" }
  >,
): void {
  const deploymentId = Deno.env.get("DENO_DEPLOYMENT_ID") ?? null;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");

  console.error(JSON.stringify({
    requestId,
    functionName: "admin-coworker-documents",
    deploymentId,
    deploymentVersion: deploymentId?.split("_").at(-1) ?? null,
    projectRef: supabaseUrl === undefined
      ? null
      : new URL(supabaseUrl).hostname.split(".")[0],
    actorUserId,
    action: {
      name: action.action,
      userId: action.userId,
      documentId: action.documentId,
    },
    rpcName: error.rpcName,
    sqlState: error.sqlState,
    message: error.databaseMessage,
    details: error.details,
    hint: error.hint,
  }));
}

export async function startReview(
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

export async function verifySignature(
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
      action.documentId,
      action.documentVersionId,
      action.verificationStatus,
    ),
  });
}

export async function acceptDocument(
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

export async function rejectDocument(
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

export async function createDownloadUrl(
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
    target.originalFilename,
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
