import { COWORKER_DOCUMENTS_BUCKET } from "../_shared/coworker-document-edge/storage-config.ts";
import {
  type CoworkerDocument,
  createCoworkerDocumentParser,
} from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import { RPC } from "./contracts.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
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

export interface UploadFinalizationResult {
  uploadSessionId: string;
  finalized: true;
  document: CoworkerDocument;
}

type UploadReservationRpcName =
  | typeof RPC.reserveNewUpload
  | typeof RPC.reserveVersionUpload;

const RESERVATION_KEYS = [
  "userId",
  "documentId",
  "documentCreated",
  "documentVersionId",
  "versionNumber",
  "uploadSessionId",
  "bucket",
  "path",
  "originalFilename",
  "storedFilename",
  "declaredMimeType",
  "expectedSizeBytes",
  "signatureDeclarationType",
  "expiresAt",
] as const;

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
  rpcName: UploadReservationRpcName,
  documentId: string | null,
): UploadReservation {
  const result = backendObject(value, rpcName, RESERVATION_KEYS);
  const reservation: UploadReservation = {
    userId: backendString(result, "userId", rpcName),
    documentId: backendUuid(result, "documentId", rpcName),
    documentCreated: backendBoolean(
      result,
      "documentCreated",
      rpcName,
    ),
    documentVersionId: backendUuid(
      result,
      "documentVersionId",
      rpcName,
    ),
    versionNumber: backendPositiveInteger(
      result,
      "versionNumber",
      rpcName,
    ),
    uploadSessionId: backendUuid(
      result,
      "uploadSessionId",
      rpcName,
    ),
    bucket: backendString(result, "bucket", rpcName),
    path: backendString(result, "path", rpcName),
    originalFilename: backendString(
      result,
      "originalFilename",
      rpcName,
    ),
    storedFilename: backendString(
      result,
      "storedFilename",
      rpcName,
    ),
    declaredMimeType: backendString(
      result,
      "declaredMimeType",
      rpcName,
    ),
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
    reservation.userId !== userId ||
    reservation.bucket !== COWORKER_DOCUMENTS_BUCKET ||
    (documentId === null && !reservation.documentCreated) ||
    (documentId !== null &&
      (reservation.documentCreated || reservation.documentId !== documentId))
  ) {
    throw new BackendContractError(rpcName);
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
): UploadFinalizationResult {
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
    document.userId !== userId
  ) {
    throw new BackendContractError(RPC.finalizeUpload);
  }
  return {
    uploadSessionId,
    finalized: true,
    document,
  };
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
