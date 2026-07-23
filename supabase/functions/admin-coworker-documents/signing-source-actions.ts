import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { createSignedDownloadUrl } from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  parseSigningSourceCatalog,
  parseSigningSourceDetail,
} from "./signing-source-catalog-contracts.ts";
import type { SigningSourceActionRequest } from "./signing-source-contracts.ts";
import { handleSigningSourceUploadAction } from "./signing-source-upload-actions.ts";
import {
  parseSigningSourceDownloadTarget,
  parseSigningSourcePublishResult,
} from "./signing-source-command-contracts.ts";
import {
  getSigningSourceCatalog,
  getSigningSourceDetail,
  getSigningSourceDownloadTarget,
  publishSigningSourceVersion,
} from "./signing-source-rpc.ts";

export async function handleSigningSourceAction(
  client: SupabaseClient,
  actorUserId: string,
  action: SigningSourceActionRequest,
): Promise<Response> {
  switch (action.action) {
    case "getSigningSourceCatalog": {
      const data = await getSigningSourceCatalog(client, actorUserId);
      return Response.json({
        ok: true,
        action: "getSigningSourceCatalog",
        sources: parseSigningSourceCatalog(data),
      });
    }
    case "getSigningSourceDetail": {
      const data = await getSigningSourceDetail(
        client,
        actorUserId,
        action.sourceId,
      );
      return Response.json({
        ok: true,
        action: "getSigningSourceDetail",
        source: parseSigningSourceDetail(data, action.sourceId),
      });
    }
    case "publishSigningSourceVersion":
      return await publishVersion(
        client,
        actorUserId,
        action.sourceVersionId,
      );
    case "downloadSigningSourceVersion":
      return await downloadVersion(
        client,
        actorUserId,
        action.sourceVersionId,
      );
    default:
      return await handleSigningSourceUploadAction(
        client,
        actorUserId,
        action,
      );
  }
}

async function publishVersion(
  client: SupabaseClient,
  actorUserId: string,
  sourceVersionId: string,
): Promise<Response> {
  const data = await publishSigningSourceVersion(
    client,
    actorUserId,
    sourceVersionId,
  );
  return Response.json({
    ok: true,
    action: "publishSigningSourceVersion",
    result: parseSigningSourcePublishResult(data, sourceVersionId),
  });
}

async function downloadVersion(
  client: SupabaseClient,
  actorUserId: string,
  sourceVersionId: string,
): Promise<Response> {
  const data = await getSigningSourceDownloadTarget(
    client,
    actorUserId,
    sourceVersionId,
  );
  const target = parseSigningSourceDownloadTarget(data, sourceVersionId);
  const signedUrl = await createSignedDownloadUrl(
    client,
    target,
    target.signedUrlExpiresInSeconds,
    "create_signing_source_signed_download_url",
  );

  return Response.json({
    ok: true,
    action: "downloadSigningSourceVersion",
    download: {
      sourceId: target.sourceId,
      sourceVersionId: target.sourceVersionId,
      sourceCode: target.sourceCode,
      signedUrl,
      expiresInSeconds: target.signedUrlExpiresInSeconds,
      originalFilename: target.originalFilename,
      mimeType: target.mimeType,
      sizeBytes: target.sizeBytes,
    },
  });
}
