import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { createSignedDownloadUrl } from "../_shared/coworker-document-edge/signed-storage.ts";
import {
  COWORKER_SIGNING_PACKAGE_RPC,
  type CoworkerSigningPackageActionRequest,
} from "./signing-package-contracts.ts";
import { SIGNING_PACKAGE_RPC_ERROR_CONTEXT } from "./rpc-error-mapping.ts";
import { parseCoworkerSigningPackagePortal } from "./signing-package-portal-contracts.ts";
import {
  parseSigningPackageItemUploadReservation,
  parseSigningPackageSourceDownloadTarget,
  parseSubmittedSigningPackageItem,
} from "./signing-package-response-contracts.ts";
import {
  getSigningPackagePortal,
  getSigningPackageSourceDownloadTarget,
  reserveSigningPackageItemUpload,
  submitSigningPackageItem,
} from "./signing-package-rpc.ts";
import { activateUploadReservation, recoverUpload } from "./upload-actions.ts";
import { compensateReservation } from "./upload-cleanup.ts";

export async function handleCoworkerSigningPackageAction(
  client: SupabaseClient,
  userId: string,
  action: CoworkerSigningPackageActionRequest,
  requestId: string,
): Promise<Response> {
  switch (action.action) {
    case "getSigningPackagePortal": {
      const data = await getSigningPackagePortal(client, userId);
      return Response.json({
        ok: true,
        action: "getSigningPackagePortal",
        portal: parseCoworkerSigningPackagePortal(data, userId),
      });
    }
    case "downloadSigningPackageSource":
      return await downloadPackageSource(
        client,
        userId,
        action.packageItemId,
      );
    case "reserveSigningPackageItemUpload":
      return await reservePackageItemUpload(
        client,
        userId,
        action,
        requestId,
      );
    case "recoverUpload":
      return await recoverUpload(
        client,
        userId,
        action.uploadSessionId,
        SIGNING_PACKAGE_RPC_ERROR_CONTEXT,
      );
    case "submitSigningPackageItem": {
      const data = await submitSigningPackageItem(
        client,
        userId,
        action.packageItemId,
      );
      return Response.json({
        ok: true,
        action: "submitSigningPackageItem",
        result: parseSubmittedSigningPackageItem(
          data,
          action.packageItemId,
        ),
      });
    }
  }
}

async function downloadPackageSource(
  client: SupabaseClient,
  userId: string,
  packageItemId: string,
): Promise<Response> {
  const targetData = await getSigningPackageSourceDownloadTarget(
    client,
    userId,
    packageItemId,
  );
  const target = parseSigningPackageSourceDownloadTarget(
    targetData,
    packageItemId,
  );
  const signedUrl = await createSignedDownloadUrl(
    client,
    target,
    target.signedUrlExpiresInSeconds,
    "create_signing_package_source_signed_download_url",
  );

  return Response.json({
    ok: true,
    action: "downloadSigningPackageSource",
    download: {
      packageId: target.packageId,
      packageItemId: target.packageItemId,
      sourceId: target.sourceId,
      sourceVersionId: target.sourceVersionId,
      sourceVersionNumber: target.sourceVersionNumber,
      signedUrl,
      expiresInSeconds: target.signedUrlExpiresInSeconds,
      originalFilename: target.originalFilename,
      mimeType: target.mimeType,
      sizeBytes: target.sizeBytes,
    },
  });
}

async function reservePackageItemUpload(
  client: SupabaseClient,
  userId: string,
  action: Extract<
    CoworkerSigningPackageActionRequest,
    { action: "reserveSigningPackageItemUpload" }
  >,
  requestId: string,
): Promise<Response> {
  const reservationData = await reserveSigningPackageItemUpload(
    client,
    userId,
    action.packageItemId,
    action.upload,
  );
  const reservation = parseSigningPackageItemUploadReservation(
    reservationData,
    action.packageItemId,
    action.upload,
  );

  try {
    const { activation, signedUpload } = await activateUploadReservation(
      client,
      userId,
      reservation,
      "create_signing_package_item_signed_upload_url",
      SIGNING_PACKAGE_RPC_ERROR_CONTEXT,
    );
    return Response.json({
      ok: true,
      action: "reserveSigningPackageItemUpload",
      upload: {
        packageId: reservation.packageId,
        packageItemId: reservation.packageItemId,
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
      COWORKER_SIGNING_PACKAGE_RPC.reserveItemUpload,
    );
    throw error;
  }
}
