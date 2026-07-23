import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import {
  type ReserveSigningSourceUploadPayload,
  SIGNING_SOURCE_RPC,
} from "./signing-source-contracts.ts";

export function getSigningSourceCatalog(
  client: SupabaseClient,
  actorUserId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.getCatalog, {
    p_actor_user_id: actorUserId,
  });
}

export function getSigningSourceDetail(
  client: SupabaseClient,
  actorUserId: string,
  sourceId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.getDetail, {
    p_source_id: sourceId,
    p_actor_user_id: actorUserId,
  });
}

export function reserveSigningSourceUpload(
  client: SupabaseClient,
  actorUserId: string,
  payload: ReserveSigningSourceUploadPayload,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.reserveUpload, {
    p_actor_user_id: actorUserId,
    p_payload: payload,
  });
}

export function activateSigningSourceUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.activateUpload, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
  });
}

export function getSigningSourceUploadTarget(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.getUploadTarget, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
  });
}

export function finalizeSigningSourceUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
  contentSha256Base64: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.finalizeUpload, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
    p_content_sha256_base64: contentSha256Base64,
  });
}

export function cancelSigningSourceUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.cancelUpload, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
  });
}

export function recordSigningSourceCleanup(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
  success: boolean,
  failureCode: string | null,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.recordCleanup, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
    p_success: success,
    p_failure_code: failureCode,
  });
}

export function publishSigningSourceVersion(
  client: SupabaseClient,
  actorUserId: string,
  sourceVersionId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_SOURCE_RPC.publishVersion, {
    p_actor_user_id: actorUserId,
    p_source_version_id: sourceVersionId,
  });
}

export function getSigningSourceDownloadTarget(
  client: SupabaseClient,
  actorUserId: string,
  sourceVersionId: string,
): Promise<unknown> {
  return callRpc(
    client,
    SIGNING_SOURCE_RPC.getDownloadTarget,
    {
      p_source_version_id: sourceVersionId,
      p_actor_user_id: actorUserId,
    },
  );
}
