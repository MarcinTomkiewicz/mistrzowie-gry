import { withSupabase } from "npm:@supabase/server@^1";
import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { sha256Base64 } from "../_shared/coworker-document-edge/sha256.ts";
import {
  createSignedDownloadUrl,
  createSignedUploadUrl,
  downloadStorageObject,
} from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  compensateUploadReservation,
  completeUploadCleanup,
} from "../_shared/coworker-document-edge/upload-cleanup.ts";
import {
  parseAssignmentList,
  parseWaivedAssignment,
} from "./assignment-contracts.ts";
import {
  type AdminOperationalRequest,
  type CancelUploadResult,
  type CleanupResult,
  parseActivation,
  parseCancelResult,
  parseCleanupResult,
  parseDashboard,
  parseDocumentResult,
  parseDownloadTarget,
  parseFinalization,
  parsePublishResult,
  parseRequest,
  parseReservation,
  parseUploadTarget,
  parseVersion,
  RPC,
  type UploadReservation,
} from "./contracts.ts";
import {
  createErrorResponse,
  InvalidJsonError,
  MissingUserClaimsError,
  UploadedFileValidationError,
} from "./errors.ts";

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
  const [catalogData, listData] = await Promise.all([
    callRpc(client, RPC.getCatalog, {
      p_actor_user_id: actorUserId,
    }),
    callRpc(client, RPC.getList, {
      p_actor_user_id: actorUserId,
    }),
  ]);

  return Response.json({
    ok: true,
    ...parseDashboard(catalogData, listData),
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

  const action = parseRequest(body);

  switch (action.action) {
    case "saveDocument":
      return await saveDocument(client, actorUserId, action);

    case "getDocumentDetail":
      return await getDocumentDetail(client, actorUserId, action);

    case "reserveUpload":
      return await reserveUpload(
        client,
        actorUserId,
        action,
        requestId,
      );

    case "finalizeUpload":
      return await finalizeUpload(
        client,
        actorUserId,
        action.uploadSessionId,
      );

    case "cancelUpload":
      return await cancelUpload(
        client,
        actorUserId,
        action.uploadSessionId,
      );

    case "configureVersion":
      return await configureVersion(client, actorUserId, action);

    case "publishVersion":
      return await publishVersion(client, actorUserId, action);

    case "getAssignmentList":
      return await getAssignmentList(client, actorUserId, action);

    case "waiveAssignment":
      return await waiveAssignment(client, actorUserId, action);

    case "archiveDocument":
      return await archiveDocument(client, actorUserId, action);

    case "downloadDocumentVersion":
      return await createDownloadUrl(client, actorUserId, action);
  }
}

async function saveDocument(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<AdminOperationalRequest, { action: "saveDocument" }>,
): Promise<Response> {
  const data = await callRpc(client, RPC.saveDocument, {
    p_actor_user_id: actorUserId,
    p_payload: action.document,
  });

  return Response.json({
    ok: true,
    action: "saveDocument",
    document: parseDocumentResult(data, RPC.saveDocument),
  });
}

async function getDocumentDetail(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminOperationalRequest,
    { action: "getDocumentDetail" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.getDetail, {
    p_document_id: action.documentId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "getDocumentDetail",
    document: parseDocumentResult(
      data,
      RPC.getDetail,
      action.documentId,
    ),
  });
}

async function reserveUpload(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<AdminOperationalRequest, { action: "reserveUpload" }>,
  requestId: string,
): Promise<Response> {
  const reservationData = await callRpc(client, RPC.reserveUpload, {
    p_actor_user_id: actorUserId,
    p_payload: action.upload,
  });
  const reservation = parseReservation(reservationData);

  try {
    const activationData = await callRpc(
      client,
      RPC.activateSignedUpload,
      {
        p_actor_user_id: actorUserId,
        p_upload_session_id: reservation.uploadSessionId,
      },
    );
    const activation = parseActivation(activationData, reservation);

    const signedUpload = await createSignedUploadUrl(
      client,
      activation,
      "create_operational_signed_upload_url",
    );

    return Response.json({
      ok: true,
      action: "reserveUpload",
      upload: {
        documentId: reservation.documentId,
        documentVersionId: reservation.documentVersionId,
        versionNumber: reservation.versionNumber,
        uploadSessionId: reservation.uploadSessionId,
        originalFilename: reservation.originalFilename,
        storedFilename: reservation.storedFilename,
        declaredMimeType: reservation.declaredMimeType,
        expectedSizeBytes: reservation.expectedSizeBytes,
      },
      signedUpload: {
        path: activation.path,
        token: signedUpload.token,
        signedUrl: signedUpload.signedUrl,
        expiresAt: activation.expiresAt,
      },
    });
  } catch (error) {
    await compensateReservation(
      client,
      actorUserId,
      reservation,
      requestId,
    );
    throw error;
  }
}

async function finalizeUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<Response> {
  const targetData = await callRpc(client, RPC.getUploadTarget, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
  });
  const target = parseUploadTarget(targetData);

  let contentSha256Base64 = target.contentSha256Base64;

  if (!target.finalized) {
    const bytes = await downloadStorageObject(
      client,
      target,
      "download_operational_upload_for_hash",
    );

    if (bytes.byteLength !== target.expectedSizeBytes) {
      throw new UploadedFileValidationError("SIZE_MISMATCH");
    }

    contentSha256Base64 = await sha256Base64(bytes);
  }

  if (contentSha256Base64 === null) {
    throw new UploadedFileValidationError("SHA256_UNAVAILABLE");
  }

  const finalizationData = await callRpc(client, RPC.finalizeUpload, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
    p_content_sha256_base64: contentSha256Base64,
  });

  return Response.json({
    ok: true,
    action: "finalizeUpload",
    result: parseFinalization(finalizationData, uploadSessionId),
  });
}

async function cancelUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<Response> {
  const cancellation = await cancelUploadInDatabase(
    client,
    actorUserId,
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

  const cleanup = await completeCleanup(
    client,
    actorUserId,
    cancellation,
  );

  return Response.json({
    ok: true,
    action: "cancelUpload",
    uploadSessionId,
    cancelled: true,
    cleanupStatus: cleanup?.cleanupStatus ?? "completed",
    cleanupCompletedAt: cleanup?.cleanupCompletedAt ?? null,
  });
}

async function configureVersion(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminOperationalRequest,
    { action: "configureVersion" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.configureVersion, {
    p_actor_user_id: actorUserId,
    p_payload: action.configuration,
  });

  return Response.json({
    ok: true,
    action: "configureVersion",
    version: parseVersion(
      data,
      RPC.configureVersion,
      action.configuration.documentVersionId,
    ),
  });
}

async function publishVersion(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminOperationalRequest,
    { action: "publishVersion" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.publishVersion, {
    p_actor_user_id: actorUserId,
    p_document_version_id: action.documentVersionId,
  });

  return Response.json({
    ok: true,
    action: "publishVersion",
    result: parsePublishResult(data, action.documentVersionId),
  });
}

async function getAssignmentList(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminOperationalRequest,
    { action: "getAssignmentList" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.getAssignmentList, {
    p_document_version_id: action.documentVersionId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "getAssignmentList",
    assignments: parseAssignmentList(data, action.documentVersionId),
  });
}

async function waiveAssignment(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminOperationalRequest,
    { action: "waiveAssignment" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.waiveAssignment, {
    p_assignment_id: action.assignmentId,
    p_actor_user_id: actorUserId,
    p_reason: action.reason,
  });

  return Response.json({
    ok: true,
    action: "waiveAssignment",
    assignment: parseWaivedAssignment(data, action.assignmentId),
  });
}

async function archiveDocument(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminOperationalRequest,
    { action: "archiveDocument" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.archiveDocument, {
    p_document_id: action.documentId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "archiveDocument",
    document: parseDocumentResult(
      data,
      RPC.archiveDocument,
      action.documentId,
    ),
  });
}

async function createDownloadUrl(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminOperationalRequest,
    { action: "downloadDocumentVersion" }
  >,
): Promise<Response> {
  const targetData = await callRpc(client, RPC.getDownloadTarget, {
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
    "create_admin_operational_download_url",
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

async function cancelUploadInDatabase(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<CancelUploadResult> {
  const data = await callRpc(client, RPC.cancelUpload, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
  });

  return parseCancelResult(data, uploadSessionId);
}

function completeCleanup(
  client: SupabaseClient,
  actorUserId: string,
  cancellation: CancelUploadResult,
): Promise<CleanupResult | null> {
  return completeUploadCleanup(
    client,
    cancellation,
    (success, failureCode) =>
      recordCleanup(
        client,
        actorUserId,
        cancellation.uploadSessionId,
        success,
        failureCode,
      ),
    (error) => logCleanupRecordFailure(cancellation.uploadSessionId, error),
  );
}

async function recordCleanup(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
  success: boolean,
  failureCode: string | null,
) {
  const data = await callRpc(client, RPC.recordCleanup, {
    p_actor_user_id: actorUserId,
    p_upload_session_id: uploadSessionId,
    p_success: success,
    p_failure_code: failureCode,
  });

  return parseCleanupResult(data, uploadSessionId);
}

async function compensateReservation(
  client: SupabaseClient,
  actorUserId: string,
  reservation: UploadReservation,
  requestId: string,
): Promise<void> {
  try {
    await compensateUploadReservation(
      () =>
        cancelUploadInDatabase(
          client,
          actorUserId,
          reservation.uploadSessionId,
        ),
      (cancellation) => completeCleanup(client, actorUserId, cancellation),
    );
  } catch (error) {
    console.error(JSON.stringify({
      code: "UPLOAD_RESERVATION_COMPENSATION_FAILED",
      requestId,
      uploadSessionId: reservation.uploadSessionId,
      errorType: errorName(error),
    }));
  }
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "UnknownError";
}

function logCleanupRecordFailure(
  uploadSessionId: string,
  error: unknown,
): void {
  console.error(JSON.stringify({
    code: "CLEANUP_FAILURE_RECORD_FAILED",
    requestId: crypto.randomUUID(),
    uploadSessionId,
    errorType: errorName(error),
  }));
}
