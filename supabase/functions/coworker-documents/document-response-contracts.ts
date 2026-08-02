import { COWORKER_DOCUMENTS_BUCKET } from "../_shared/coworker-document-edge/storage-config.ts";
import {
  type CoworkerDocument,
  createCoworkerDocumentParser,
} from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import { RPC } from "./contracts.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
  type UnknownObject,
} from "./contract-context.ts";

export { parsePortalResult } from "./document-portal-response-contract.ts";

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
const { parseCoworkerDocument } = createCoworkerDocumentParser(
  coworkerDocumentReaders,
  (rpcName) => new BackendContractError(rpcName),
);

export function parseSubmittedDocumentResult(
  value: unknown,
  userId: string,
  documentId: string,
  documentVersionId: string,
): CoworkerDocument {
  const result = parseCoworkerDocument(value, RPC.submitDocument);
  if (
    result.id !== documentId ||
    result.userId !== userId ||
    result.status !== "submitted" ||
    result.origin !== "coworker_upload" ||
    result.submittedVersionId !== documentVersionId ||
    result.submittedVersion?.id !== documentVersionId
  ) {
    throw new BackendContractError(RPC.submitDocument);
  }
  return result;
}

export function parseWithdrawnDocumentResult(
  value: unknown,
  userId: string,
  documentId: string,
): CoworkerDocument {
  const result = parseCoworkerDocument(value, RPC.withdrawDocument);
  if (
    result.id !== documentId ||
    result.userId !== userId ||
    result.status !== "withdrawn"
  ) {
    throw new BackendContractError(RPC.withdrawDocument);
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
