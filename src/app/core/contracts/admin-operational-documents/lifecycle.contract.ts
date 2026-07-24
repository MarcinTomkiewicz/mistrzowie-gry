import type {
  IAdminOperationalCatalog,
} from '../../interfaces/i-admin-operational-catalog';
import type {
  IAdminOperationalDocumentDetail,
  IAdminOperationalVersionDownload,
} from '../../interfaces/i-admin-operational-document';
import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
  type DownloadAdminOperationalVersionRequest,
} from '../../types/admin-operational-document';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeObjectReader,
  readEdgeNonBlankString,
  readEdgePositiveInteger,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  assertAdminOperationalDocumentDetail,
  documentDetailReader,
} from './document.contract';

const trueReader = createEdgeLiteralReader([true] as const);

const publishResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.publishVersion,
  ] as const),
  result: createEdgeObjectReader({
    published: trueReader,
    document: documentDetailReader,
  }),
});

const archiveResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.archiveDocument,
  ] as const),
  document: documentDetailReader,
});

const downloadResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.downloadDocumentVersion,
  ] as const),
  download: createEdgeObjectReader({
    documentId: readEdgeUuid,
    documentVersionId: readEdgeUuid,
    signedUrl: readEdgeNonBlankString,
    expiresInSeconds: readEdgePositiveInteger,
    originalFilename: readEdgeNonBlankString,
    mimeType: readEdgeNonBlankString,
    sizeBytes: readEdgePositiveInteger,
    purpose: createEdgeLiteralReader(['admin_review', 'admin_download'] as const),
  }),
});

export function parsePublishedVersion(
  value: unknown,
  documentVersionId: string,
  catalog: IAdminOperationalCatalog,
): void {
  const document = publishResponseReader(
    value,
    'response',
  ).result.document;
  assertAdminOperationalDocumentDetail(
    document,
    catalog,
    'response.result.document',
  );
  assertEdgeContract(
    document.status === 'published' &&
      document.currentPublishedVersionId === documentVersionId &&
      document.currentPublishedVersion?.status === 'published',
    'response.result.document',
    'a document with the requested current published version',
  );
}

export function parseArchivedDocument(
  value: unknown,
  documentId: string,
  catalog: IAdminOperationalCatalog,
): IAdminOperationalDocumentDetail {
  const document = archiveResponseReader(value, 'response').document;
  assertAdminOperationalDocumentDetail(
    document,
    catalog,
    'response.document',
  );
  assertEdgeContract(
    document.id === documentId &&
      document.status === 'archived' &&
      document.archivedAt !== null &&
      (
        document.currentPublishedVersionId === null ||
        document.currentPublishedVersion?.status === 'archived'
      ),
    'response.document',
    'the requested archived document',
  );
  return document;
}

export function parseVersionDownload(
  value: unknown,
  request: DownloadAdminOperationalVersionRequest,
): IAdminOperationalVersionDownload {
  const response = downloadResponseReader(value, 'response');
  assertEdgeContract(
    response.download.documentVersionId === request.documentVersionId &&
      response.download.purpose === request.purpose &&
      response.download.expiresInSeconds <= 300,
    'response.download',
    'the requested short-lived version download',
  );
  return response;
}
