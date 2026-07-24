import { COWORKER_DOCUMENTS_BUCKET } from "../_shared/coworker-document-edge/storage-config.ts";
import { createCoworkerDocumentParser } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import { RPC } from "./contracts.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
  type UnknownObject,
} from "./contract-context.ts";
import {
  SIGNATURE_DECLARATION_TYPES,
  type SignatureDeclarationType,
} from "./upload-request-contracts.ts";

export interface UploadActivationExpectation {
  documentId: string;
  documentVersionId: string;
  uploadSessionId: string;
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  declaredMimeType: string;
}

export interface UploadReservation extends UploadActivationExpectation {
  userId: string;
  documentCreated: boolean;
  versionNumber: number;
  originalFilename: string;
  storedFilename: string;
  signatureDeclarationType: SignatureDeclarationType;
  expiresAt: string;
}

export interface SignedUploadActivation {
  userId: string;
  documentId: string;
  documentVersionId: string;
  uploadSessionId: string;
  bucket: string;
  path: string;
  expectedSizeBytes: number;
  expectedMimeType: string;
  issuedAt: string;
  expiresAt: string;
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
  (rpcName: typeof RPC.finalizeUpload) => new BackendContractError(rpcName),
);

export function parseUploadReservation(
  value: unknown,
  userId: string,
): UploadReservation {
  const result = backendObject(value, RPC.reserveUpload);
  const reservation: UploadReservation = {
    userId: backendString(result, "userId", RPC.reserveUpload),
    documentId: backendUuid(result, "documentId", RPC.reserveUpload),
    documentCreated: backendBoolean(
      result,
      "documentCreated",
      RPC.reserveUpload,
    ),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.reserveUpload,
    ),
    versionNumber: backendPositiveInteger(
      result,
      "versionNumber",
      RPC.reserveUpload,
    ),
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.reserveUpload,
    ),
    bucket: backendString(result, "bucket", RPC.reserveUpload),
    path: backendString(result, "path", RPC.reserveUpload),
    originalFilename: backendString(
      result,
      "originalFilename",
      RPC.reserveUpload,
    ),
    storedFilename: backendString(
      result,
      "storedFilename",
      RPC.reserveUpload,
    ),
    declaredMimeType: backendString(
      result,
      "declaredMimeType",
      RPC.reserveUpload,
    ),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      RPC.reserveUpload,
    ),
    signatureDeclarationType: backendEnum(
      result,
      "signatureDeclarationType",
      SIGNATURE_DECLARATION_TYPES,
      RPC.reserveUpload,
    ),
    expiresAt: backendTimestamp(result, "expiresAt", RPC.reserveUpload),
  };

  if (
    reservation.userId !== userId ||
    reservation.bucket !== COWORKER_DOCUMENTS_BUCKET
  ) {
    throw new BackendContractError(RPC.reserveUpload);
  }
  return reservation;
}

export function parseSignedUploadActivation(
  value: unknown,
  userId: string,
  expected: UploadActivationExpectation,
): SignedUploadActivation {
  const activation = parseActivation(value);
  if (
    activation.userId !== userId ||
    activation.documentId !== expected.documentId ||
    activation.documentVersionId !== expected.documentVersionId ||
    activation.uploadSessionId !== expected.uploadSessionId ||
    activation.bucket !== expected.bucket ||
    activation.path !== expected.path ||
    activation.expectedSizeBytes !== expected.expectedSizeBytes ||
    activation.expectedMimeType !== expected.declaredMimeType
  ) {
    throw new BackendContractError(RPC.activateSignedUpload);
  }
  return activation;
}

export function parseRecoveredSignedUploadActivation(
  value: unknown,
  userId: string,
  uploadSessionId: string,
): SignedUploadActivation {
  const activation = parseActivation(value);
  if (
    activation.userId !== userId ||
    activation.uploadSessionId !== uploadSessionId ||
    activation.bucket !== COWORKER_DOCUMENTS_BUCKET
  ) {
    throw new BackendContractError(RPC.activateSignedUpload);
  }
  return activation;
}

export function parseFinalizationResult(
  value: unknown,
  userId: string,
  uploadSessionId: string,
  expectedDocument?: {
    documentId: string;
    documentVersionId: string;
  },
): UnknownObject {
  const result = backendObject(value, RPC.finalizeUpload, [
    "uploadSessionId",
    "finalized",
    "document",
  ]);
  if (
    backendUuid(result, "uploadSessionId", RPC.finalizeUpload) !==
      uploadSessionId ||
    backendBoolean(result, "finalized", RPC.finalizeUpload) !== true
  ) {
    throw new BackendContractError(RPC.finalizeUpload);
  }

  const document = parseCoworkerDocument(
    result.document,
    RPC.finalizeUpload,
  );
  if (
    backendUuid(document, "userId", RPC.finalizeUpload) !== userId ||
    (expectedDocument !== undefined &&
      (
        backendUuid(document, "id", RPC.finalizeUpload) !==
          expectedDocument.documentId ||
        backendUuid(document, "currentVersionId", RPC.finalizeUpload) !==
          expectedDocument.documentVersionId
      ))
  ) {
    throw new BackendContractError(RPC.finalizeUpload);
  }
  return result;
}

function parseActivation(value: unknown): SignedUploadActivation {
  const result = backendObject(value, RPC.activateSignedUpload, [
    "userId",
    "documentId",
    "documentVersionId",
    "uploadSessionId",
    "bucket",
    "path",
    "expectedSizeBytes",
    "expectedMimeType",
    "issuedAt",
    "expiresAt",
  ]);
  return {
    userId: backendString(result, "userId", RPC.activateSignedUpload),
    documentId: backendUuid(result, "documentId", RPC.activateSignedUpload),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      RPC.activateSignedUpload,
    ),
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      RPC.activateSignedUpload,
    ),
    bucket: backendString(result, "bucket", RPC.activateSignedUpload),
    path: backendString(result, "path", RPC.activateSignedUpload),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      RPC.activateSignedUpload,
    ),
    expectedMimeType: backendString(
      result,
      "expectedMimeType",
      RPC.activateSignedUpload,
    ),
    issuedAt: backendTimestamp(result, "issuedAt", RPC.activateSignedUpload),
    expiresAt: backendTimestamp(
      result,
      "expiresAt",
      RPC.activateSignedUpload,
    ),
  };
}
