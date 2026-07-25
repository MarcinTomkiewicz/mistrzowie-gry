import {
  backendBoolean,
  backendNullableTimestamp,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendUuid,
} from "./backend-reader.ts";
import { BackendContractError } from "./errors.ts";
import { RPC } from "./rpc-names.ts";

const RESERVATION_KEYS = [
  "userId",
  "questionnaireRevision",
  "declarationId",
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
  "idempotent",
  "alreadyFinalized",
] as const;

export interface QuestionnaireDocumentReservation {
  userId: string;
  questionnaireRevision: number;
  declarationId: string;
  documentId: string;
  documentCreated: boolean;
  documentVersionId: string;
  versionNumber: number;
  uploadSessionId: string | null;
  bucket: "coworker-documents";
  path: string;
  originalFilename: string;
  storedFilename: string;
  declaredMimeType: "application/pdf";
  expectedSizeBytes: number;
  signatureDeclarationType: "unsigned";
  expiresAt: string | null;
  idempotent: boolean;
  alreadyFinalized: boolean;
}

export function parseQuestionnaireDocumentReservation(
  value: unknown,
  expected: {
    userId: string;
    questionnaireRevision: number;
    declarationId: string;
    expectedSizeBytes: number;
    originalFilename: string;
  },
): QuestionnaireDocumentReservation {
  const rpcName = RPC.reserveQuestionnaireDocument;
  const source = backendObject(value, RESERVATION_KEYS, rpcName);
  const bucket = backendString(source, "bucket", rpcName);
  const declaredMimeType = backendString(
    source,
    "declaredMimeType",
    rpcName,
  );
  const signatureDeclarationType = backendString(
    source,
    "signatureDeclarationType",
    rpcName,
  );
  const reservation: QuestionnaireDocumentReservation = {
    userId: backendUuid(source, "userId", rpcName),
    questionnaireRevision: backendPositiveInteger(
      source,
      "questionnaireRevision",
      rpcName,
    ),
    declarationId: backendUuid(source, "declarationId", rpcName),
    documentId: backendUuid(source, "documentId", rpcName),
    documentCreated: backendBoolean(source, "documentCreated", rpcName),
    documentVersionId: backendUuid(source, "documentVersionId", rpcName),
    versionNumber: backendPositiveInteger(source, "versionNumber", rpcName),
    uploadSessionId: source.uploadSessionId === null
      ? null
      : backendUuid(source, "uploadSessionId", rpcName),
    bucket: readBucket(bucket),
    path: backendString(source, "path", rpcName),
    originalFilename: backendString(source, "originalFilename", rpcName),
    storedFilename: backendString(source, "storedFilename", rpcName),
    declaredMimeType: readPdfMimeType(declaredMimeType),
    expectedSizeBytes: backendPositiveInteger(
      source,
      "expectedSizeBytes",
      rpcName,
    ),
    signatureDeclarationType: readUnsigned(signatureDeclarationType),
    expiresAt: backendNullableTimestamp(source, "expiresAt", rpcName),
    idempotent: backendBoolean(source, "idempotent", rpcName),
    alreadyFinalized: backendBoolean(source, "alreadyFinalized", rpcName),
  };

  if (
    reservation.userId !== expected.userId ||
    reservation.questionnaireRevision !== expected.questionnaireRevision ||
    reservation.declarationId !== expected.declarationId ||
    reservation.expectedSizeBytes !== expected.expectedSizeBytes ||
    reservation.originalFilename !== expected.originalFilename ||
    (!reservation.alreadyFinalized && reservation.uploadSessionId === null)
  ) {
    throw new BackendContractError(rpcName);
  }
  return reservation;
}

export function assertRecoveredQuestionnaireDocumentReservation(
  previous: QuestionnaireDocumentReservation,
  recovered: QuestionnaireDocumentReservation,
): void {
  if (
    previous.userId !== recovered.userId ||
    previous.questionnaireRevision !== recovered.questionnaireRevision ||
    previous.declarationId !== recovered.declarationId ||
    previous.documentId !== recovered.documentId ||
    previous.documentVersionId !== recovered.documentVersionId ||
    previous.versionNumber !== recovered.versionNumber ||
    previous.bucket !== recovered.bucket ||
    previous.path !== recovered.path ||
    previous.originalFilename !== recovered.originalFilename ||
    previous.storedFilename !== recovered.storedFilename ||
    previous.declaredMimeType !== recovered.declaredMimeType ||
    previous.expectedSizeBytes !== recovered.expectedSizeBytes ||
    previous.signatureDeclarationType !==
      recovered.signatureDeclarationType ||
    (!recovered.alreadyFinalized &&
      recovered.uploadSessionId !== previous.uploadSessionId)
  ) {
    throw new BackendContractError(RPC.reserveQuestionnaireDocument);
  }
}

function readBucket(value: string): "coworker-documents" {
  if (value !== "coworker-documents") {
    throw new BackendContractError(RPC.reserveQuestionnaireDocument);
  }
  return value;
}

function readPdfMimeType(value: string): "application/pdf" {
  if (value !== "application/pdf") {
    throw new BackendContractError(RPC.reserveQuestionnaireDocument);
  }
  return value;
}

function readUnsigned(value: string): "unsigned" {
  if (value !== "unsigned") {
    throw new BackendContractError(RPC.reserveQuestionnaireDocument);
  }
  return value;
}
