import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { createSignedUploadUrl } from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  type CoworkerDocumentActionRequest,
  RPC,
} from "./contracts.ts";
import {
  cancelUploadAction,
  compensateReservation,
} from "./upload-cleanup.ts";
import {
  parseFinalizationResult,
  parseRecoveredSignedUploadActivation,
  parseSignedUploadActivation,
  parseUploadReservation,
  type SignedUploadActivation,
  type UploadActivationExpectation,
} from "./upload-contracts.ts";

type DocumentUploadAction = Extract<
  CoworkerDocumentActionRequest,
  { action: "reserveUpload" | "finalizeUpload" | "cancelUpload" }
>;

export interface ActivatedUpload {
  activation: SignedUploadActivation;
  signedUpload: {
    signedUrl: string;
    token: string;
  };
}

export async function handleDocumentUploadAction(
  client: SupabaseClient,
  userId: string,
  action: DocumentUploadAction,
  requestId: string,
): Promise<Response> {
  switch (action.action) {
    case "reserveUpload":
      return await reserveUpload(client, userId, action, requestId);
    case "finalizeUpload":
      return await finalizeUpload(client, userId, action.uploadSessionId);
    case "cancelUpload":
      return await cancelUploadAction(
        client,
        userId,
        action.uploadSessionId,
      );
  }
}

export async function activateUploadReservation(
  client: SupabaseClient,
  userId: string,
  reservation: UploadActivationExpectation,
  storageOperation: string,
  rpcErrorContext: string | null = null,
): Promise<ActivatedUpload> {
  const activationData = await activateUpload(
    client,
    userId,
    reservation.uploadSessionId,
    rpcErrorContext,
  );
  const activation = parseSignedUploadActivation(
    activationData,
    userId,
    reservation,
  );
  return {
    activation,
    signedUpload: await createSignedUploadUrl(
      client,
      activation,
      storageOperation,
    ),
  };
}

export async function recoverUpload(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
  rpcErrorContext: string | null = null,
): Promise<Response> {
  const activationData = await activateUpload(
    client,
    userId,
    uploadSessionId,
    rpcErrorContext,
  );
  const activation = parseRecoveredSignedUploadActivation(
    activationData,
    userId,
    uploadSessionId,
  );
  const signedUpload = await createSignedUploadUrl(
    client,
    activation,
    "create_coworker_recovered_signed_upload_url",
  );

  return Response.json({
    ok: true,
    action: "recoverUpload",
    upload: {
      documentId: activation.documentId,
      documentVersionId: activation.documentVersionId,
      uploadSessionId: activation.uploadSessionId,
      expectedSizeBytes: activation.expectedSizeBytes,
      expectedMimeType: activation.expectedMimeType,
    },
    signedUpload: {
      token: signedUpload.token,
      signedUrl: signedUpload.signedUrl,
      expiresAt: activation.expiresAt,
    },
  });
}

async function reserveUpload(
  client: SupabaseClient,
  userId: string,
  action: Extract<DocumentUploadAction, { action: "reserveUpload" }>,
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
    const { activation, signedUpload } = await activateUploadReservation(
      client,
      userId,
      reservation,
      "create_signed_upload_url",
    );
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
    await compensateReservation(
      client,
      userId,
      reservation,
      requestId,
      RPC.reserveUpload,
    );
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

function activateUpload(
  client: SupabaseClient,
  userId: string,
  uploadSessionId: string,
  rpcErrorContext: string | null = null,
): Promise<unknown> {
  return callRpc(
    client,
    RPC.activateSignedUpload,
    {
      p_user_id: userId,
      p_actor_user_id: userId,
      p_upload_session_id: uploadSessionId,
    },
    rpcErrorContext,
  );
}
