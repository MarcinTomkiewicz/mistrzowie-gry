import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { createSignedDownloadUrl } from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  type CoworkerDocumentActionRequest,
  RPC,
} from "./contracts.ts";
import {
  parseDocumentResult,
  parseDownloadTarget,
  parseNotificationReadResult,
  parsePortalResult,
} from "./document-response-contracts.ts";

type DocumentCommandAction = Exclude<
  CoworkerDocumentActionRequest,
  { action: "reserveUpload" | "finalizeUpload" | "cancelUpload" }
>;

export async function getDocumentPortal(
  client: SupabaseClient,
  userId: string,
): Promise<Response> {
  const data = await callRpc(client, RPC.getPortal, {
    p_user_id: userId,
    p_actor_user_id: userId,
  });
  return Response.json(parsePortalResult(data, userId));
}

export async function handleDocumentCommandAction(
  client: SupabaseClient,
  userId: string,
  action: DocumentCommandAction,
): Promise<Response> {
  switch (action.action) {
    case "submitDocument":
      return await submitDocument(client, userId, action.documentId);
    case "withdrawDocument":
      return await withdrawDocument(client, userId, action.documentId);
    case "downloadDocumentVersion":
      return await createDownloadUrl(
        client,
        userId,
        action.documentVersionId,
      );
    case "markNotificationRead":
      return await markNotificationRead(
        client,
        userId,
        action.notificationId,
      );
  }
}

async function submitDocument(
  client: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<Response> {
  const data = await callRpc(client, RPC.submitDocument, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_document_id: documentId,
  });
  return Response.json({
    ok: true,
    action: "submitDocument",
    document: parseDocumentResult(
      data,
      RPC.submitDocument,
      userId,
      documentId,
    ),
  });
}

async function withdrawDocument(
  client: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<Response> {
  const data = await callRpc(client, RPC.withdrawDocument, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_document_id: documentId,
  });
  return Response.json({
    ok: true,
    action: "withdrawDocument",
    document: parseDocumentResult(
      data,
      RPC.withdrawDocument,
      userId,
      documentId,
    ),
  });
}

async function createDownloadUrl(
  client: SupabaseClient,
  userId: string,
  documentVersionId: string,
): Promise<Response> {
  const targetData = await callRpc(client, RPC.getDownloadTarget, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_document_version_id: documentVersionId,
    p_purpose: "self_download",
  });
  const target = parseDownloadTarget(
    targetData,
    userId,
    documentVersionId,
  );
  const signedUrl = await createSignedDownloadUrl(
    client,
    target,
    target.signedUrlExpiresInSeconds,
    "create_signed_download_url",
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
    },
  });
}

async function markNotificationRead(
  client: SupabaseClient,
  userId: string,
  notificationId: string,
): Promise<Response> {
  const data = await callRpc(client, RPC.markNotificationRead, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_notification_id: notificationId,
  });
  return Response.json({
    ok: true,
    action: "markNotificationRead",
    notification: parseNotificationReadResult(data, notificationId),
  });
}
