import { createContractReaders } from "./contract-readers.ts";
import {
  COWORKER_DOCUMENT_DELETION_RPC,
  COWORKER_DOCUMENT_PRESERVATION_KINDS,
  type CoworkerDocumentDeletionCapabilities,
  type CoworkerDocumentDeletionRpcName,
  type CoworkerDocumentPreservationKind,
  type CoworkerDocumentVersionDeletionCapability,
  type DocumentDeletionResult,
  type DocumentVersionDeletionResult,
  type DocumentVersionPreservationResult,
} from "./coworker-document-deletion-models.ts";
import { COWORKER_DOCUMENT_ORIGINS } from "./coworker-document-models.ts";

const CAPABILITIES_KEYS = [
  "documentId",
  "origin",
  "deletionRequested",
  "canDeleteDocument",
  "documentBlockingReasons",
  "currentVersionId",
  "canDeleteCurrentVersion",
  "currentVersionBlockingReasons",
  "versions",
] as const;

const VERSION_CAPABILITY_KEYS = [
  "documentVersionId",
  "isCurrent",
  "canDelete",
  "blockingReasons",
] as const;

const VERSION_DELETION_KEYS = [
  "documentId",
  "documentVersionId",
  "deletionRequested",
  "cleanupEnqueued",
  "capabilities",
] as const;

const DOCUMENT_DELETION_KEYS = [
  "documentId",
  "deletionRequested",
  "documentDeleted",
  "cleanupEnqueued",
] as const;

const PRESERVATION_KEYS = [
  "documentId",
  "documentVersionId",
  "preservationKind",
  "preserved",
] as const;

export class CoworkerDocumentDeletionBackendContractError extends Error {
  constructor(readonly rpcName: CoworkerDocumentDeletionRpcName) {
    super("Coworker document deletion backend contract validation failed.");
    this.name = "CoworkerDocumentDeletionBackendContractError";
  }
}

const readers = createContractReaders<CoworkerDocumentDeletionRpcName>({
  createRequestError: () =>
    new CoworkerDocumentDeletionBackendContractError(
      COWORKER_DOCUMENT_DELETION_RPC.getCapabilities,
    ),
  createBackendError: (rpcName) =>
    new CoworkerDocumentDeletionBackendContractError(rpcName),
  allowEmptyBackendNullableString: false,
});

const {
  backendArray,
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendNonNegativeInteger,
  backendNullableUuid,
  backendObject,
  backendString,
  backendUuid,
} = readers;

export function parseCoworkerDocumentDeletionCapabilities(
  value: unknown,
  documentId: string,
  rpcName: CoworkerDocumentDeletionRpcName =
    COWORKER_DOCUMENT_DELETION_RPC.getCapabilities,
): CoworkerDocumentDeletionCapabilities {
  const source = backendObject(value, rpcName, CAPABILITIES_KEYS);
  const parsed: CoworkerDocumentDeletionCapabilities = {
    documentId: backendUuid(source, "documentId", rpcName),
    origin: backendEnum(
      source,
      "origin",
      COWORKER_DOCUMENT_ORIGINS,
      rpcName,
    ),
    deletionRequested: backendBoolean(
      source,
      "deletionRequested",
      rpcName,
    ),
    canDeleteDocument: backendBoolean(
      source,
      "canDeleteDocument",
      rpcName,
    ),
    documentBlockingReasons: parseReasons(
      source,
      "documentBlockingReasons",
      rpcName,
    ),
    currentVersionId: backendNullableUuid(
      source,
      "currentVersionId",
      rpcName,
    ),
    canDeleteCurrentVersion: backendBoolean(
      source,
      "canDeleteCurrentVersion",
      rpcName,
    ),
    currentVersionBlockingReasons: parseReasons(
      source,
      "currentVersionBlockingReasons",
      rpcName,
    ),
    versions: backendArray(source, "versions", rpcName).map((item) =>
      parseVersionCapability(item, rpcName)
    ),
  };

  if (parsed.documentId !== documentId) {
    throw new CoworkerDocumentDeletionBackendContractError(rpcName);
  }
  return parsed;
}

export function parseDocumentVersionDeletionResult(
  value: unknown,
  documentId: string,
  documentVersionId: string,
): DocumentVersionDeletionResult {
  const rpcName = COWORKER_DOCUMENT_DELETION_RPC.requestVersionDeletion;
  const source = backendObject(value, rpcName, VERSION_DELETION_KEYS);
  const result: DocumentVersionDeletionResult = {
    documentId: backendUuid(source, "documentId", rpcName),
    documentVersionId: backendUuid(source, "documentVersionId", rpcName),
    deletionRequested: backendLiteral(
      source,
      "deletionRequested",
      true,
      rpcName,
    ),
    cleanupEnqueued: backendNonNegativeInteger(
      source,
      "cleanupEnqueued",
      rpcName,
    ),
    capabilities: parseCoworkerDocumentDeletionCapabilities(
      source.capabilities,
      documentId,
      rpcName,
    ),
  };
  if (
    result.documentId !== documentId ||
    result.documentVersionId !== documentVersionId
  ) {
    throw new CoworkerDocumentDeletionBackendContractError(rpcName);
  }
  return result;
}

export function parseDocumentDeletionResult(
  value: unknown,
  documentId: string,
): DocumentDeletionResult {
  const rpcName = COWORKER_DOCUMENT_DELETION_RPC.requestDocumentDeletion;
  const source = backendObject(value, rpcName, DOCUMENT_DELETION_KEYS);
  const result: DocumentDeletionResult = {
    documentId: backendUuid(source, "documentId", rpcName),
    deletionRequested: backendLiteral(
      source,
      "deletionRequested",
      true,
      rpcName,
    ),
    documentDeleted: backendBoolean(source, "documentDeleted", rpcName),
    cleanupEnqueued: backendNonNegativeInteger(
      source,
      "cleanupEnqueued",
      rpcName,
    ),
  };
  if (result.documentId !== documentId) {
    throw new CoworkerDocumentDeletionBackendContractError(rpcName);
  }
  return result;
}

export function parseDocumentVersionPreservationResult(
  value: unknown,
  documentId: string,
  documentVersionId: string,
  preservationKind: CoworkerDocumentPreservationKind | null,
): DocumentVersionPreservationResult {
  const rpcName = COWORKER_DOCUMENT_DELETION_RPC.setVersionPreservation;
  const source = backendObject(value, rpcName, PRESERVATION_KEYS);
  const result: DocumentVersionPreservationResult = {
    documentId: backendUuid(source, "documentId", rpcName),
    documentVersionId: backendUuid(source, "documentVersionId", rpcName),
    preservationKind: source.preservationKind === null ? null : backendEnum(
      source,
      "preservationKind",
      COWORKER_DOCUMENT_PRESERVATION_KINDS,
      rpcName,
    ),
    preserved: backendBoolean(source, "preserved", rpcName),
  };
  if (
    result.documentId !== documentId ||
    result.documentVersionId !== documentVersionId ||
    result.preservationKind !== preservationKind ||
    result.preserved !== (preservationKind !== null)
  ) {
    throw new CoworkerDocumentDeletionBackendContractError(rpcName);
  }
  return result;
}

function parseVersionCapability(
  value: unknown,
  rpcName: CoworkerDocumentDeletionRpcName,
): CoworkerDocumentVersionDeletionCapability {
  const source = backendObject(value, rpcName, VERSION_CAPABILITY_KEYS);
  return {
    documentVersionId: backendUuid(source, "documentVersionId", rpcName),
    isCurrent: source.isCurrent === null
      ? null
      : backendBoolean(source, "isCurrent", rpcName),
    canDelete: backendBoolean(source, "canDelete", rpcName),
    blockingReasons: parseReasons(source, "blockingReasons", rpcName),
  };
}

function parseReasons(
  source: Record<string, unknown>,
  key: string,
  rpcName: CoworkerDocumentDeletionRpcName,
): string[] {
  return backendArray(source, key, rpcName).map((reason) =>
    backendString({ reason }, "reason", rpcName)
  );
}
