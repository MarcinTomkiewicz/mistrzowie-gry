import { ICoworkerDocument } from '../../interfaces/i-coworker-document';
import { COWORKER_DOCUMENT_ACTION } from '../../types/coworker-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { createStrictEdgeObjectReader } from '../../utils/strict-edge-contract';
import { coworkerDocumentReader } from './coworker-document-readers';

export interface ICoworkerNotificationReadResult {
  readonly id: string;
  readonly read: true;
  readonly readAt: string;
}

export function createSubmitDocumentReader(
  documentId: string,
  documentVersionId: string,
): EdgeReader<ICoworkerDocument> {
  return createDocumentMutationReader(
    COWORKER_DOCUMENT_ACTION.submitDocument,
    documentId,
    (document, path) => {
      assertEdgeContract(
        document.origin === 'coworker_upload' &&
          document.status === 'submitted' &&
          document.submittedVersionId === documentVersionId &&
          document.submittedVersion?.id === documentVersionId,
        `${path}.document`,
        `a submitted coworker upload at version ${documentVersionId}`,
      );
    },
  );
}

export function createWithdrawDocumentReader(
  documentId: string,
): EdgeReader<ICoworkerDocument> {
  return createDocumentMutationReader(
    COWORKER_DOCUMENT_ACTION.withdrawDocument,
    documentId,
    (document, path) => {
      assertEdgeContract(
        document.origin === 'coworker_upload' &&
          document.status === 'withdrawn',
        `${path}.document`,
        'a withdrawn coworker upload',
      );
    },
  );
}

export function createNotificationReadReader(
  notificationId: string,
): EdgeReader<ICoworkerNotificationReadResult> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([
        COWORKER_DOCUMENT_ACTION.markNotificationRead,
      ] as const),
      notification: createStrictEdgeObjectReader({
        id: readEdgeUuid,
        read: createEdgeLiteralReader([true] as const),
        readAt: readEdgeTimestamp,
      }),
    })(value, path);
    assertEdgeContract(
      response.notification.id === notificationId,
      `${path}.notification.id`,
      `the requested notification id ${notificationId}`,
    );
    return response.notification;
  };
}

function createDocumentMutationReader<TAction extends
  | typeof COWORKER_DOCUMENT_ACTION.submitDocument
  | typeof COWORKER_DOCUMENT_ACTION.withdrawDocument>(
  action: TAction,
  documentId: string,
  assertResult: (document: ICoworkerDocument, path: string) => void,
): EdgeReader<ICoworkerDocument> {
  return (value, path) => {
    const response = createStrictEdgeObjectReader({
      ok: createEdgeLiteralReader([true] as const),
      action: createEdgeLiteralReader([action] as const),
      document: coworkerDocumentReader,
    })(value, path);
    assertEdgeContract(
      response.document.id === documentId,
      `${path}.document.id`,
      `the requested document id ${documentId}`,
    );
    assertResult(response.document, path);
    return response.document;
  };
}
