import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { sha256Base64 } from "../_shared/coworker-document-edge/sha256.ts";
import {
  createSignedUploadUrl,
  downloadStorageObject,
} from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  OnboardingStateInvalidError,
  UploadedFileValidationError,
} from "./errors.ts";
import type {
  SigningSourceActionRequest,
  SigningSourceUploadReservation,
  SigningSourceUploadTarget,
} from "./signing-source-contracts.ts";
import {
  parseSigningSourceUploadActivation,
  parseSigningSourceUploadReservation,
  parseSigningSourceUploadTarget,
  type SigningSourceUploadExpectation,
} from "./signing-source-upload-contracts.ts";
import {
  parseSigningSourceUploadFinalization,
  toPublicSigningSourceFinalization,
} from "./signing-source-command-contracts.ts";
import {
  cancelSigningSourceUploadAndCleanup,
  compensateSigningSourceUploadReservation,
} from "./signing-source-upload-cleanup.ts";
import {
  activateSigningSourceUpload,
  finalizeSigningSourceUpload,
  getSigningSourceUploadTarget,
  reserveSigningSourceUpload,
} from "./signing-source-rpc.ts";

type SigningSourceUploadAction = Extract<
  SigningSourceActionRequest,
  {
    action:
      | "reserveSigningSourceUpload"
      | "recoverSigningSourceUpload"
      | "finalizeSigningSourceUpload"
      | "cancelSigningSourceUpload";
  }
>;

export async function handleSigningSourceUploadAction(
  client: SupabaseClient,
  actorUserId: string,
  action: SigningSourceUploadAction,
): Promise<Response> {
  switch (action.action) {
    case "reserveSigningSourceUpload":
      return await reserveUpload(client, actorUserId, action);
    case "recoverSigningSourceUpload":
      return await recoverUpload(client, actorUserId, action.uploadSessionId);
    case "finalizeSigningSourceUpload":
      return await finalizeUpload(client, actorUserId, action.uploadSessionId);
    case "cancelSigningSourceUpload":
      return await cancelUpload(client, actorUserId, action.uploadSessionId);
  }
}

async function reserveUpload(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    SigningSourceUploadAction,
    { action: "reserveSigningSourceUpload" }
  >,
): Promise<Response> {
  const reservationData = await reserveSigningSourceUpload(
    client,
    actorUserId,
    action.upload,
  );
  const reservation = parseSigningSourceUploadReservation(
    reservationData,
    action.upload,
  );

  try {
    const activationData = await activateSigningSourceUpload(
      client,
      actorUserId,
      reservation.uploadSessionId,
    );
    const activation = parseSigningSourceUploadActivation(
      activationData,
      activationExpectation(reservation),
    );
    const signedUpload = await createSignedUploadUrl(
      client,
      activation,
      "create_signing_source_signed_upload_url",
    );

    return Response.json({
      ok: true,
      action: "reserveSigningSourceUpload",
      upload: {
        sourceId: reservation.sourceId,
        sourceCreated: reservation.sourceCreated,
        sourceVersionId: reservation.sourceVersionId,
        versionNumber: reservation.versionNumber,
        uploadSessionId: reservation.uploadSessionId,
        originalFilename: reservation.originalFilename,
        storedFilename: reservation.storedFilename,
        declaredMimeType: reservation.declaredMimeType,
        expectedSizeBytes: reservation.expectedSizeBytes,
      },
      signedUpload: {
        token: signedUpload.token,
        signedUrl: signedUpload.signedUrl,
        expiresAt: activation.expiresAt,
      },
    });
  } catch (error) {
    await compensateSigningSourceUploadReservation(
      client,
      actorUserId,
      reservation,
    );
    throw error;
  }
}

async function recoverUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<Response> {
  const target = await readUploadTarget(client, actorUserId, uploadSessionId);
  if (target.finalized) {
    throw new OnboardingStateInvalidError();
  }

  const activationData = await activateSigningSourceUpload(
    client,
    actorUserId,
    uploadSessionId,
  );
  const activation = parseSigningSourceUploadActivation(
    activationData,
    activationExpectation(target),
  );
  const signedUpload = await createSignedUploadUrl(
    client,
    activation,
    "recover_signing_source_signed_upload_url",
  );

  return Response.json({
    ok: true,
    action: "recoverSigningSourceUpload",
    upload: {
      sourceId: target.sourceId,
      sourceVersionId: target.sourceVersionId,
      uploadSessionId: target.uploadSessionId,
      expectedSizeBytes: target.expectedSizeBytes,
      expectedMimeType: target.expectedMimeType,
    },
    signedUpload: {
      token: signedUpload.token,
      signedUrl: signedUpload.signedUrl,
      expiresAt: activation.expiresAt,
    },
  });
}

async function finalizeUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<Response> {
  const target = await readUploadTarget(client, actorUserId, uploadSessionId);
  const contentSha256Base64 = target.finalized &&
      target.contentSha256Base64 !== null
    ? target.contentSha256Base64
    : await hashStoredUpload(client, target);
  const finalizationData = await finalizeSigningSourceUpload(
    client,
    actorUserId,
    uploadSessionId,
    contentSha256Base64,
  );
  const finalization = parseSigningSourceUploadFinalization(
    finalizationData,
    target,
  );

  if (finalization.contentSha256Base64 !== contentSha256Base64) {
    throw new UploadedFileValidationError("SHA256_MISMATCH");
  }

  return Response.json({
    ok: true,
    action: "finalizeSigningSourceUpload",
    result: toPublicSigningSourceFinalization(finalization),
  });
}

async function cancelUpload(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<Response> {
  const cleanupCompletedAt = await cancelSigningSourceUploadAndCleanup(
    client,
    actorUserId,
    uploadSessionId,
  );

  return Response.json({
    ok: true,
    action: "cancelSigningSourceUpload",
    uploadSessionId,
    cancelled: true,
    cleanupStatus: "completed",
    cleanupCompletedAt,
  });
}

async function readUploadTarget(
  client: SupabaseClient,
  actorUserId: string,
  uploadSessionId: string,
): Promise<SigningSourceUploadTarget> {
  const data = await getSigningSourceUploadTarget(
    client,
    actorUserId,
    uploadSessionId,
  );
  return parseSigningSourceUploadTarget(data, uploadSessionId);
}

async function hashStoredUpload(
  client: SupabaseClient,
  target: SigningSourceUploadTarget,
): Promise<string> {
  const bytes = await downloadStorageObject(
    client,
    target,
    "download_signing_source_upload_for_hash",
  );
  if (bytes.byteLength !== target.expectedSizeBytes) {
    throw new UploadedFileValidationError("SIZE_MISMATCH");
  }

  try {
    return await sha256Base64(bytes);
  } catch {
    throw new UploadedFileValidationError("SHA256_UNAVAILABLE");
  }
}

function activationExpectation(
  value: SigningSourceUploadReservation | SigningSourceUploadTarget,
): SigningSourceUploadExpectation {
  return {
    sourceId: value.sourceId,
    sourceVersionId: value.sourceVersionId,
    uploadSessionId: value.uploadSessionId,
    bucket: value.bucket,
    path: value.path,
    expectedSizeBytes: value.expectedSizeBytes,
    expectedMimeType: "declaredMimeType" in value
      ? value.declaredMimeType
      : value.expectedMimeType,
  };
}
