import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import {
  parseCancelUploadResult,
  parseCleanupResult,
  parseDocumentActionRequest,
  parseDocumentResult,
  parseDownloadTarget,
  parseFinalizationResult,
  parseNotificationReadResult,
  parsePortalResult,
  parseSignedUploadActivation,
  parseSignedUploadData,
  parseUploadReservation,
  RPC,
  type CancelUploadResult,
  type CoworkerDocumentActionRequest,
  type RpcName,
  type UploadReservation,
} from "./contracts.ts";
import {
  createErrorResponse,
  InvalidJsonError,
  MissingUserClaimsError,
  RpcCallError,
  StorageCallError,
  StorageCleanupError,
} from "./errors.ts";

const ALLOWED_METHODS = "GET, POST, OPTIONS";
const STORAGE_REMOVE_FAILURE_CODE = "storage_remove_failed";

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

async function handleGet(
  client: SupabaseClient,
  userId: string,
): Promise<Response> {
  const data = await callRpc(client, RPC.getPortal, {
    p_user_id: userId,
    p_actor_user_id: userId,
  });
  return Response.json(parsePortalResult(data, userId));
}

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

  const action = parseDocumentActionRequest(body);

  switch (action.action) {
    case "reserveUpload":
      return await reserveUpload(client, userId, action, requestId);
    case "finalizeUpload":
      return await finalizeUpload(client, userId, action.uploadSessionId);
    case "cancelUpload":
      return await cancelUpload(client, userId, action.uploadSessionId);
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

async function reserveUpload(
  client: SupabaseClient,
  userId: string,
  action: Extract<
    CoworkerDocumentActionRequest,
    { action: "reserveUpload" }
  >,
  requestId: string,
): Promise<Response> {
  const reservationData = await callRpc(client, RPC.reserveUpload, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_payload: {
      documentId: action.documentId,
      requirementId: action.requirementId,
      documentDefinitionId: action.documentDefinitionId,
      onboardingCaseId: action.onboardingCaseId,
      originalFilename: action.originalFilename,
      declaredMimeType: action.declaredMimeType,
      sizeBytes: action.sizeBytes,
      signatureDeclarationType: action.signatureDeclarationType,
      title: action.title,
    },
  });
  const reservation = parseUploadReservation(reservationData, userId);

  try {
    const activationData = await callRpc(client, RPC.activateSignedUpload, {
      p_user_id: userId,
      p_actor_user_id: userId,
      p_upload_session_id: reservation.uploadSessionId,
    });
    const activation = parseSignedUploadActivation(
      activationData,
      reservation,
    );

    const { data, error } = await client.storage
      .from(activation.bucket)
      .createSignedUploadUrl(activation.path, { upsert: false });

    if (error !== null) {
      throw new StorageCallError("create_signed_upload_url");
    }

    const signedUpload = parseSignedUploadData(data);

    return Response.json({
      ok: true,
      action: "reserveUpload",
      upload: {
        documentId: reservation.documentId,
        documentCreated: reservation.documentCreated,
        documentVersionId: reservation.documentVersionId,
        versionNumber: reservation.versionNumber,
        uploadSessionId: reservation.uploadSessionId,
        originalFilename: reservation.originalFilename,
        storedFilename: reservation.storedFilename,
        declaredMimeType: reservation.declaredMimeType,
        expectedSizeBytes: reservation.expectedSizeBytes,
        signatureDeclarationType: reservation.signatureDeclarationType,
      },
      signedUpload: {
        path: activation.path,
        token: signedUpload.token,
        signedUrl: signedUpload.signedUrl,
        expiresAt: activation.expiresAt,
      },
    });
  } catch (error) {
    await compensateReservation(client, userId, reservation, requestId);
    throw error;
  }
}

async function finalizeUpload(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
): Promise<Response> {
  const data = await callRpc(client, RPC.finalizeUpload, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
  });

  return Response.json({
    ok: true,
    action: "finalizeUpload",
    result: parseFinalizationResult(data, userId, uploadSessionId),
  });
}

async function cancelUpload(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
): Promise<Response> {
  const cancellation = await cancelUploadInDatabase(
    client,
    userId,
    uploadSessionId,
  );

  if (cancellation.cleanupStatus === "completed") {
    return Response.json({
      ok: true,
      action: "cancelUpload",
      uploadSessionId,
      cancelled: true,
      cleanupStatus: "completed",
    });
  }

  const cleanup = await removeCancelledObject(
    client,
    userId,
    cancellation,
  );

  return Response.json({
    ok: true,
    action: "cancelUpload",
    uploadSessionId,
    cancelled: true,
    cleanupStatus: cleanup.cleanupStatus,
    cleanupCompletedAt: cleanup.cleanupCompletedAt,
  });
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

  const { data, error } = await client.storage
    .from(target.bucket)
    .createSignedUrl(
      target.path,
      target.signedUrlExpiresInSeconds,
    );

  if (error !== null || data === null) {
    throw new StorageCallError("create_signed_download_url");
  }

  const signedUrl = readStorageSignedUrl(data);

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

async function cancelUploadInDatabase(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
): Promise<CancelUploadResult> {
  const data = await callRpc(client, RPC.cancelUpload, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
  });

  return parseCancelUploadResult(data, uploadSessionId);
}

async function removeCancelledObject(
  client: SupabaseClient,
  userId: string,
  cancellation: CancelUploadResult,
) {
  const { error } = await client.storage
    .from(cancellation.cleanupTarget.bucket)
    .remove([cancellation.cleanupTarget.path]);

  if (error !== null) {
    try {
      await recordCleanup(
        client,
        userId,
        cancellation.uploadSessionId,
        false,
        STORAGE_REMOVE_FAILURE_CODE,
      );
    } catch (recordError) {
      console.error(JSON.stringify({
        code: "CLEANUP_FAILURE_RECORD_FAILED",
        requestId: crypto.randomUUID(),
        uploadSessionId: cancellation.uploadSessionId,
        errorType: errorName(recordError),
      }));
    }

    throw new StorageCleanupError(cancellation.uploadSessionId);
  }

  return await recordCleanup(
    client,
    userId,
    cancellation.uploadSessionId,
    true,
    null,
  );
}

async function recordCleanup(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
  success: boolean,
  failureCode: string | null,
) {
  const data = await callRpc(client, RPC.recordCleanup, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_upload_session_id: uploadSessionId,
    p_success: success,
    p_failure_code: failureCode,
  });

  return parseCleanupResult(data, uploadSessionId);
}

async function compensateReservation(
  client: SupabaseClient,
  userId: string,
  reservation: UploadReservation,
  requestId: string,
): Promise<void> {
  try {
    const cancellation = await cancelUploadInDatabase(
      client,
      userId,
      reservation.uploadSessionId,
    );

    if (cancellation.cleanupStatus !== "completed") {
      await removeCancelledObject(client, userId, cancellation);
    }
  } catch (error) {
    console.error(JSON.stringify({
      code: "UPLOAD_RESERVATION_COMPENSATION_FAILED",
      requestId,
      rpcName: RPC.reserveUpload,
      uploadSessionId: reservation.uploadSessionId,
      errorType: errorName(error),
    }));
  }
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

function readStorageSignedUrl(value: unknown): string {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new StorageCallError("create_signed_download_url");
  }

  const signedUrl = (value as { [key: string]: unknown }).signedUrl;
  if (typeof signedUrl !== "string" || signedUrl === "") {
    throw new StorageCallError("create_signed_download_url");
  }

  return signedUrl;
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}
