import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  parseAssignment,
  parseDownloadTarget,
  parseNotificationRead,
  parsePortal,
  parseRequest,
  RPC,
  type RpcName,
} from "./contracts.ts";
import {
  createErrorResponse,
  InvalidJsonError,
  MissingUserClaimsError,
  RpcCallError,
  StorageCallError,
} from "./errors.ts";

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
          return await handleGet(context.supabaseAdmin, userId);
        case "POST":
          return await handlePost(request, context.supabaseAdmin, userId);
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
  userId: string,
): Promise<Response> {
  const data = await callRpc(client, RPC.getPortal, {
    p_user_id: userId,
    p_actor_user_id: userId,
  });

  return Response.json({
    ok: true,
    portal: parsePortal(data, userId),
  });
}

async function handlePost(
  request: Request,
  client: SupabaseClient,
  userId: string,
): Promise<Response> {
  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    throw new InvalidJsonError();
  }

  const action = parseRequest(body);

  switch (action.action) {
    case "downloadDocumentVersion":
      return await createDownloadUrl(
        client,
        userId,
        action.documentVersionId,
      );

    case "recordAction": {
      const data = await callRpc(client, RPC.recordAction, {
        p_user_id: userId,
        p_actor_user_id: userId,
        p_assignment_id: action.assignmentId,
        p_action: action.documentAction,
        p_decline_reason: action.declineReason,
      });

      return Response.json({
        ok: true,
        action: "recordAction",
        assignment: parseAssignment(
          data,
          userId,
          action.assignmentId,
        ),
      });
    }

    case "markNotificationRead": {
      const data = await callRpc(client, RPC.markNotificationRead, {
        p_user_id: userId,
        p_actor_user_id: userId,
        p_notification_id: action.notificationId,
      });

      return Response.json({
        ok: true,
        action: "markNotificationRead",
        notification: parseNotificationRead(
          data,
          action.notificationId,
        ),
      });
    }
  }
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
  });
  const target = parseDownloadTarget(targetData, documentVersionId);

  const { data, error } = await client.storage
    .from(target.bucket)
    .createSignedUrl(target.path, target.signedUrlExpiresInSeconds);

  if (error !== null || data === null) {
    throw new StorageCallError("create_coworker_signed_download_url");
  }

  const signedUrl = readSignedUrl(data);

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

async function callRpc(
  client: SupabaseClient,
  rpcName: RpcName,
  parameters: { [key: string]: unknown },
): Promise<unknown> {
  const { data, error } = await client.rpc(rpcName, parameters);

  if (error !== null) {
    throw new RpcCallError(rpcName, error.code ?? null);
  }

  return data;
}

function readSignedUrl(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new StorageCallError("create_coworker_signed_download_url");
  }

  const signedUrl = (value as { [key: string]: unknown }).signedUrl;
  if (typeof signedUrl !== "string" || signedUrl === "") {
    throw new StorageCallError("create_coworker_signed_download_url");
  }

  return signedUrl;
}
