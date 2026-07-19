import { ICoworkerUploadReservation } from '../../interfaces/i-coworker-document';
import {
  COWORKER_DOCUMENT_ACTION,
  CoworkerDocumentAction,
} from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  createEdgeLiteralReader,
  createEdgeObjectReader,
  readEdgeObject,
  readEdgeString,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';

const trueReader = createEdgeLiteralReader([true] as const);
const completedReader = createEdgeLiteralReader(['completed'] as const);

export const reserveUploadReader:
  EdgeReader<ICoworkerUploadReservation> = createEdgeObjectReader({
    ok: trueReader,
    action: createEdgeLiteralReader([
      COWORKER_DOCUMENT_ACTION.reserveUpload,
    ] as const),
    upload: createEdgeObjectReader({
      uploadSessionId: readEdgeUuid,
    }),
    signedUpload: createEdgeObjectReader({
      path: readEdgeString,
      token: readEdgeString,
    }),
  });

const finalizeUploadResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    COWORKER_DOCUMENT_ACTION.finalizeUpload,
  ] as const),
  result: createEdgeObjectReader({
    finalized: trueReader,
  }),
});

export const finalizeUploadReader: EdgeReader<void> =
  (value, path) => {
    finalizeUploadResponseReader(value, path);
  };

const cancelUploadFields = {
  ok: trueReader,
  action: createEdgeLiteralReader([
    COWORKER_DOCUMENT_ACTION.cancelUpload,
  ] as const),
  cancelled: trueReader,
  cleanupStatus: completedReader,
} as const;

const cancelUploadResponseReader = createEdgeObjectReader(cancelUploadFields);
const cancelUploadWithCleanupResponseReader = createEdgeObjectReader({
  ...cancelUploadFields,
  cleanupCompletedAt: readEdgeTimestamp,
});

export const cancelUploadReader: EdgeReader<void> =
  (value, path) => {
    const source = readEdgeObject(value, path);
    const reader = source['cleanupCompletedAt'] === undefined
      ? cancelUploadResponseReader
      : cancelUploadWithCleanupResponseReader;
    reader(value, path);
  };

export function createCoworkerDocumentSuccessReader<
  const TAction extends CoworkerDocumentAction,
>(
  expectedAction: TAction,
): EdgeReader<void> {
  const reader = createEdgeObjectReader({
    ok: trueReader,
    action: createEdgeLiteralReader([expectedAction] as const),
  });

  return (value, path) => {
    reader(value, path);
  };
}
