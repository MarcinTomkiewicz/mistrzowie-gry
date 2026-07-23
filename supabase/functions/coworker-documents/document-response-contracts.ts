import { COWORKER_DOCUMENTS_BUCKET } from "../_shared/coworker-document-edge/storage-config.ts";
import { RPC } from "./contracts.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
  type UnknownObject,
} from "./contract-context.ts";

export interface DownloadTarget {
  documentId: string;
  documentVersionId: string;
  bucket: string;
  path: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  purpose: "self_download";
  signedUrlExpiresInSeconds: number;
}

const {
  backendBoolean,
  backendEnum,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = coworkerDocumentReaders;

export function parsePortalResult(
  value: unknown,
  userId: string,
): UnknownObject {
  const result = backendObject(value, RPC.getPortal);
  if (backendString(result, "userId", RPC.getPortal) !== userId) {
    throw new BackendContractError(RPC.getPortal);
  }
  return result;
}

export function parseDocumentResult(
  value: unknown,
  rpcName: typeof RPC.submitDocument | typeof RPC.withdrawDocument,
  userId: string,
  documentId: string,
): UnknownObject {
  const result = backendObject(value, rpcName);
  if (
    backendUuid(result, "id", rpcName) !== documentId ||
    backendUuid(result, "userId", rpcName) !== userId
  ) {
    throw new BackendContractError(rpcName);
  }
  return result;
}

export function parseDownloadTarget(
  value: unknown,
  userId: string,
  documentVersionId: string,
): DownloadTarget {
  const result = backendObject(value, RPC.getDownloadTarget);
  const target: DownloadTarget = {
    documentId: backendUuid(
      result,
      "documentId",
      RPC.getDownloadTarget,
    ),
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
      ["self_download"] as const,
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
    target.bucket !== COWORKER_DOCUMENTS_BUCKET ||
    target.signedUrlExpiresInSeconds > 300 ||
    userId === ""
  ) {
    throw new BackendContractError(RPC.getDownloadTarget);
  }
  return target;
}

export function parseNotificationReadResult(
  value: unknown,
  notificationId: string,
): UnknownObject {
  const result = backendObject(value, RPC.markNotificationRead);
  if (
    backendUuid(result, "id", RPC.markNotificationRead) !== notificationId ||
    backendBoolean(result, "read", RPC.markNotificationRead) !== true
  ) {
    throw new BackendContractError(RPC.markNotificationRead);
  }
  backendTimestamp(result, "readAt", RPC.markNotificationRead);
  return result;
}
