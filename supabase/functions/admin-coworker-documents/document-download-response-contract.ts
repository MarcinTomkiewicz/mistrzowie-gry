import { COWORKER_DOCUMENTS_BUCKET } from "../_shared/coworker-document-edge/storage-config.ts";
import {
  adminDocumentReaders,
  type AdminDownloadPurpose,
  BackendContractError,
  type DownloadTarget,
  RPC,
} from "./contracts.ts";

const DOWNLOAD_PURPOSES = ["admin_review", "admin_download"] as const;

const {
  backendEnum,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendUuid,
} = adminDocumentReaders;

export function parseDownloadTarget(
  value: unknown,
  documentVersionId: string,
  purpose: AdminDownloadPurpose,
): DownloadTarget {
  const result = backendObject(value, RPC.getDownloadTarget, [
    "documentId",
    "documentVersionId",
    "bucket",
    "path",
    "originalFilename",
    "mimeType",
    "sizeBytes",
    "purpose",
    "signedUrlExpiresInSeconds",
  ]);
  const target: DownloadTarget = {
    documentId: backendUuid(result, "documentId", RPC.getDownloadTarget),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.getDownloadTarget,
    ),
    bucket: backendString(result, "bucket", RPC.getDownloadTarget),
    path: backendString(result, "path", RPC.getDownloadTarget),
    originalFilename: backendString(
      result,
      "originalFilename",
      RPC.getDownloadTarget,
    ),
    mimeType: backendString(result, "mimeType", RPC.getDownloadTarget),
    sizeBytes: backendPositiveInteger(
      result,
      "sizeBytes",
      RPC.getDownloadTarget,
    ),
    purpose: backendEnum(
      result,
      "purpose",
      DOWNLOAD_PURPOSES,
      RPC.getDownloadTarget,
    ),
    signedUrlExpiresInSeconds: backendPositiveInteger(
      result,
      "signedUrlExpiresInSeconds",
      RPC.getDownloadTarget,
    ),
  };

  if (
    target.documentVersionId !== documentVersionId ||
    target.purpose !== purpose ||
    target.bucket !== COWORKER_DOCUMENTS_BUCKET ||
    target.signedUrlExpiresInSeconds > 300
  ) {
    throw new BackendContractError(RPC.getDownloadTarget);
  }
  return target;
}
