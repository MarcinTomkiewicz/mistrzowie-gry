import { COWORKER_DOCUMENTS_BUCKET } from "../_shared/coworker-document-edge/storage-config.ts";
import { createSigningPackageModelParsers } from "../_shared/coworker-document-edge/signing-package-model-parser.ts";
import type { SigningPackageItem } from "../_shared/coworker-document-edge/signing-package-models.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
} from "./contract-context.ts";
import {
  COWORKER_SIGNING_PACKAGE_RPC,
  type ReserveSigningPackageItemUploadPayload,
  type SigningPackageItemUploadReservation,
  type SigningPackageSourceDownloadTarget,
} from "./signing-package-contracts.ts";
import { SIGNATURE_DECLARATION_TYPES } from "./upload-request-contracts.ts";

const {
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = coworkerDocumentReaders;

const { parseSigningPackageItem } = createSigningPackageModelParsers(
  coworkerDocumentReaders,
  (rpcName) => new BackendContractError(rpcName),
);

export function parseSigningPackageSourceDownloadTarget(
  value: unknown,
  packageItemId: string,
): SigningPackageSourceDownloadTarget {
  const rpcName = COWORKER_SIGNING_PACKAGE_RPC.getSourceDownloadTarget;
  const result = backendObject(value, rpcName, [
    "packageItemId",
    "packageId",
    "sourceId",
    "sourceVersionId",
    "sourceVersionNumber",
    "bucket",
    "path",
    "originalFilename",
    "mimeType",
    "sizeBytes",
    "signedUrlExpiresInSeconds",
  ]);
  const parsed: SigningPackageSourceDownloadTarget = {
    packageItemId: backendUuid(result, "packageItemId", rpcName),
    packageId: backendUuid(result, "packageId", rpcName),
    sourceId: backendUuid(result, "sourceId", rpcName),
    sourceVersionId: backendUuid(result, "sourceVersionId", rpcName),
    sourceVersionNumber: backendPositiveInteger(
      result,
      "sourceVersionNumber",
      rpcName,
    ),
    bucket: backendString(result, "bucket", rpcName),
    path: backendString(result, "path", rpcName),
    originalFilename: backendString(result, "originalFilename", rpcName),
    mimeType: backendString(result, "mimeType", rpcName),
    sizeBytes: backendPositiveInteger(result, "sizeBytes", rpcName),
    signedUrlExpiresInSeconds: backendPositiveInteger(
      result,
      "signedUrlExpiresInSeconds",
      rpcName,
    ),
  };

  if (
    parsed.packageItemId !== packageItemId ||
    parsed.bucket !== COWORKER_DOCUMENTS_BUCKET ||
    parsed.signedUrlExpiresInSeconds > 300
  ) {
    throw new BackendContractError(rpcName);
  }
  return parsed;
}

export function parseSigningPackageItemUploadReservation(
  value: unknown,
  packageItemId: string,
  expectedUpload: ReserveSigningPackageItemUploadPayload,
): SigningPackageItemUploadReservation {
  const rpcName = COWORKER_SIGNING_PACKAGE_RPC.reserveItemUpload;
  const result = backendObject(value, rpcName, [
    "packageId",
    "packageItemId",
    "documentId",
    "documentCreated",
    "documentVersionId",
    "versionNumber",
    "uploadSessionId",
    "sessionStatus",
    "bucket",
    "path",
    "originalFilename",
    "storedFilename",
    "declaredMimeType",
    "expectedSizeBytes",
    "signatureDeclarationType",
    "expiresAt",
  ]);
  const parsed: SigningPackageItemUploadReservation = {
    packageId: backendUuid(result, "packageId", rpcName),
    packageItemId: backendUuid(result, "packageItemId", rpcName),
    documentId: backendUuid(result, "documentId", rpcName),
    documentCreated: backendBoolean(result, "documentCreated", rpcName),
    documentVersionId: backendUuid(result, "documentVersionId", rpcName),
    versionNumber: backendPositiveInteger(
      result,
      "versionNumber",
      rpcName,
    ),
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    sessionStatus: backendLiteral(
      result,
      "sessionStatus",
      "created",
      rpcName,
    ),
    bucket: backendString(result, "bucket", rpcName),
    path: backendString(result, "path", rpcName),
    originalFilename: backendString(result, "originalFilename", rpcName),
    storedFilename: backendString(result, "storedFilename", rpcName),
    declaredMimeType: backendString(result, "declaredMimeType", rpcName),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      rpcName,
    ),
    signatureDeclarationType: backendEnum(
      result,
      "signatureDeclarationType",
      SIGNATURE_DECLARATION_TYPES,
      rpcName,
    ),
    expiresAt: backendTimestamp(result, "expiresAt", rpcName),
  };

  if (
    parsed.packageItemId !== packageItemId ||
    parsed.bucket !== COWORKER_DOCUMENTS_BUCKET ||
    parsed.signatureDeclarationType === "unsigned" ||
    parsed.originalFilename !== expectedUpload.originalFilename ||
    parsed.declaredMimeType !== expectedUpload.declaredMimeType ||
    parsed.expectedSizeBytes !== expectedUpload.sizeBytes ||
    parsed.signatureDeclarationType !==
      expectedUpload.signatureDeclarationType
  ) {
    throw new BackendContractError(rpcName);
  }
  return parsed;
}

export function parseSubmittedSigningPackageItem(
  value: unknown,
  packageItemId: string,
): SigningPackageItem {
  const rpcName = COWORKER_SIGNING_PACKAGE_RPC.submitItem;
  const parsed = parseSigningPackageItem(value, rpcName);

  if (
    parsed.id !== packageItemId ||
    parsed.status !== "submitted" ||
    parsed.signedDocumentId === null ||
    parsed.signedDocumentVersionId === null ||
    parsed.signedDocument === null ||
    parsed.signedDocument.origin !== "coworker_upload" ||
    parsed.signedDocument.submittedVersionId !==
      parsed.signedDocumentVersionId ||
    parsed.signedDocument.submittedVersion?.id !==
      parsed.signedDocumentVersionId
  ) {
    throw new BackendContractError(rpcName);
  }
  return parsed;
}
