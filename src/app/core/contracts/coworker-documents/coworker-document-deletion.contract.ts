import {
  ICoworkerDocumentDeletionCapabilities,
  ICoworkerDocumentDeletionResult,
  ICoworkerDocumentVersionDeletionResult,
  ICoworkerDocumentVersionPreservationResult,
} from '../../interfaces/i-coworker-document-deletion';
import {
  COWORKER_DOCUMENT_ACTION,
  COWORKER_DOCUMENT_ORIGINS,
  COWORKER_DOCUMENT_PRESERVATION_KINDS,
  CoworkerDocumentPreservationKind,
} from '../../types/coworker-document';
import { EdgeLiteral, EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  readEdgeBoolean,
  readEdgeNonNegativeInteger,
  readEdgeNullableBoolean,
  readEdgeString,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const reasonReader = createEdgeArrayReader(readEdgeString);
const versionCapabilityReader = createStrictEdgeObjectReader({
  documentVersionId: readEdgeUuid,
  isCurrent: readEdgeNullableBoolean,
  canDelete: readEdgeBoolean,
  blockingReasons: reasonReader,
});

export function createDeletionCapabilitiesReader(
  documentId: string,
): EdgeReader<ICoworkerDocumentDeletionCapabilities> {
  return (value, path) => {
    const capabilities = createStrictEdgeObjectReader({
      documentId: readEdgeUuid,
      origin: createEdgeLiteralReader(COWORKER_DOCUMENT_ORIGINS),
      deletionRequested: readEdgeBoolean,
      canDeleteDocument: readEdgeBoolean,
      documentBlockingReasons: reasonReader,
      currentVersionId: nullableUuidReader,
      canDeleteCurrentVersion: readEdgeBoolean,
      currentVersionBlockingReasons: reasonReader,
      versions: createEdgeArrayReader(versionCapabilityReader),
    })(value, path);
    const versionIds = capabilities.versions.map(
      (version) => version.documentVersionId,
    );
    assertEdgeContract(
      capabilities.documentId === documentId &&
        new Set(versionIds).size === versionIds.length,
      path,
      `capabilities for document ${documentId} with unique versions`,
    );
    return capabilities;
  };
}

export function createDeletionCapabilitiesResponseReader(
  documentId: string,
): EdgeReader<ICoworkerDocumentDeletionCapabilities> {
  const reader = createStrictEdgeObjectReader({
    ok: createEdgeLiteralReader([true] as const),
    action: createEdgeLiteralReader([
      COWORKER_DOCUMENT_ACTION.getDeletionCapabilities,
    ] as const),
    capabilities: createDeletionCapabilitiesReader(documentId),
  });
  return (value, path) => reader(value, path).capabilities;
}

export function createDocumentVersionDeletionReader(
  documentId: string,
  documentVersionId: string,
): EdgeReader<ICoworkerDocumentVersionDeletionResult> {
  const resultReader: EdgeReader<ICoworkerDocumentVersionDeletionResult> =
    createStrictEdgeObjectReader({
      documentId: readEdgeUuid,
      documentVersionId: readEdgeUuid,
      deletionRequested: createEdgeLiteralReader([true] as const),
      cleanupEnqueued: readEdgeNonNegativeInteger,
      capabilities: createDeletionCapabilitiesReader(documentId),
    });
  return createCheckedActionResultReader(
    COWORKER_DOCUMENT_ACTION.deleteDocumentVersion,
    resultReader,
    (result, path) => {
      assertEdgeContract(
        result.documentId === documentId &&
          result.documentVersionId === documentVersionId,
        path,
        `a deletion result for document ${documentId} version ${documentVersionId}`,
      );
    },
  );
}

export function createDocumentDeletionReader(
  documentId: string,
): EdgeReader<ICoworkerDocumentDeletionResult> {
  const resultReader: EdgeReader<ICoworkerDocumentDeletionResult> =
    createStrictEdgeObjectReader({
      documentId: readEdgeUuid,
      deletionRequested: createEdgeLiteralReader([true] as const),
      documentDeleted: readEdgeBoolean,
      cleanupEnqueued: readEdgeNonNegativeInteger,
    });
  return createCheckedActionResultReader(
    COWORKER_DOCUMENT_ACTION.deleteDocument,
    resultReader,
    (result, path) => {
      assertEdgeContract(
        result.documentId === documentId,
        `${path}.documentId`,
        `the requested document id ${documentId}`,
      );
    },
  );
}

export function createDocumentVersionPreservationReader(
  documentId: string,
  documentVersionId: string,
  preservationKind: CoworkerDocumentPreservationKind | null,
): EdgeReader<ICoworkerDocumentVersionPreservationResult> {
  const resultReader: EdgeReader<ICoworkerDocumentVersionPreservationResult> =
    createStrictEdgeObjectReader({
      documentId: readEdgeUuid,
      documentVersionId: readEdgeUuid,
      preservationKind: createEdgeNullableReader(
        createEdgeLiteralReader(COWORKER_DOCUMENT_PRESERVATION_KINDS),
      ),
      preserved: readEdgeBoolean,
    });
  return createCheckedActionResultReader(
    'setDocumentVersionPreservation',
    resultReader,
    (result, path) => {
      assertEdgeContract(
        result.documentId === documentId &&
          result.documentVersionId === documentVersionId &&
          result.preservationKind === preservationKind &&
          result.preserved === (preservationKind !== null),
        path,
        'the requested version preservation state',
      );
    },
  );
}

function createCheckedActionResultReader<TResult>(
  action: EdgeLiteral,
  resultReader: EdgeReader<TResult>,
  assertResult: (result: TResult, path: string) => void,
): EdgeReader<TResult> {
  return (value, path) => {
    const result = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([action] as const),
      result: resultReader,
    })(value, path).result;
    assertResult(result, `${path}.result`);
    return result;
  };
}
