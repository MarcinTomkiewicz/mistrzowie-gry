import {
  ADMIN_OPERATIONAL_DOCUMENT_CODE_PATTERN,
} from '../../configs/admin-coworker-operational-documents.config';
import {
  COWORKER_DOCUMENT_SHELL_LIMITS,
} from '../../configs/coworker-documents.config';
import type { IAdminOperationalCatalog } from '../../interfaces/i-admin-operational-catalog';
import type {
  IAdminOperationalDashboard,
  IAdminOperationalDocumentDetail,
  IAdminOperationalDocumentListItem,
} from '../../interfaces/i-admin-operational-document';
import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
  type SaveAdminOperationalDocumentPayload,
} from '../../types/admin-operational-document';
import {
  type AdminOperationalStoredVersion,
} from '../../types/admin-operational-version';
import {
  COWORKER_OPERATIONAL_ACTION_MODES,
  COWORKER_OPERATIONAL_DOCUMENT_STATUSES,
} from '../../types/coworker-operational-document';
import type { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeArrayOrder,
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLimitedTextReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeNonBlankString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import { assertTargetRelations } from './targets.contract';
import {
  assertCatalog,
  catalogReader,
} from './catalog.contract';
import {
  assertRecovery,
  recoveryReader,
} from './recovery.contract';
import {
  storedVersionReader,
  unpublishedVersionReader,
} from './version.contract';

const trueReader = createEdgeLiteralReader([true] as const);
const actionModeReader = createEdgeLiteralReader(
  COWORKER_OPERATIONAL_ACTION_MODES,
);
const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const titleReader = createEdgeLimitedTextReader(
  COWORKER_DOCUMENT_SHELL_LIMITS.titleLength,
  readEdgeNonBlankString,
);
const descriptionReader = createEdgeNullableReader(
  createEdgeLimitedTextReader(COWORKER_DOCUMENT_SHELL_LIMITS.descriptionLength),
);
const categoryReader = createEdgeLimitedTextReader(
  COWORKER_DOCUMENT_SHELL_LIMITS.categoryLength,
  readEdgeNonBlankString,
);

const documentFields = {
  id: readEdgeUuid,
  code: readOperationalCode,
  title: titleReader,
  description: descriptionReader,
  category: categoryReader,
  status: createEdgeLiteralReader(COWORKER_OPERATIONAL_DOCUMENT_STATUSES),
  currentPublishedVersionId: nullableUuidReader,
  revision: readEdgePositiveInteger,
  createdAt: readEdgeTimestamp,
  updatedAt: readEdgeTimestamp,
} as const;

const documentListItemReader: EdgeReader<IAdminOperationalDocumentListItem> =
  createEdgeObjectReader({
    ...documentFields,
    currentPublishedVersionNumber: createEdgeNullableReader(
      readEdgePositiveInteger,
    ),
    currentActionMode: createEdgeNullableReader(actionModeReader),
    currentPublishedAt: readEdgeNullableTimestamp,
    unpublishedVersion: createEdgeNullableReader(
      unpublishedVersionReader,
    ),
  });

const documentDetailReader: EdgeReader<IAdminOperationalDocumentDetail> =
  createEdgeObjectReader({
    ...documentFields,
    currentPublishedVersion: createEdgeNullableReader(
      storedVersionReader,
    ),
    versions: createEdgeArrayReader(storedVersionReader),
    uploadRecovery: createEdgeNullableReader(recoveryReader),
    publishedAt: readEdgeNullableTimestamp,
    archivedAt: readEdgeNullableTimestamp,
  });

const dashboardResponseReader = createEdgeObjectReader({
  ok: trueReader,
  catalog: catalogReader,
  documents: createEdgeArrayReader(documentListItemReader),
});

const detailResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.getDocumentDetail,
  ] as const),
  document: documentDetailReader,
});

const saveResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.saveDocument,
  ] as const),
  document: documentDetailReader,
});

export function parseDashboard(
  value: unknown,
): IAdminOperationalDashboard {
  const dashboard = dashboardResponseReader(value, 'response');
  assertCatalog(dashboard.catalog, 'response.catalog');
  dashboard.documents.forEach((document, index) => {
    const path = `response.documents[${index}]`;
    assertListItem(document, path);
    if (document.unpublishedVersion !== null) {
      assertTargetRelations(
        document.unpublishedVersion.targets,
        dashboard.catalog,
        `${path}.unpublishedVersion.targets`,
      );
    }
  });
  return {
    catalog: dashboard.catalog,
    documents: dashboard.documents,
  };
}

export function parseDetail(
  value: unknown,
  documentId: string,
  catalog: IAdminOperationalCatalog,
): IAdminOperationalDocumentDetail {
  const document = detailResponseReader(value, 'response').document;
  assertEdgeContract(
    document.id === documentId,
    'response.document.id',
    'equal to the requested documentId',
  );
  assertDetail(document, catalog, 'response.document');
  return document;
}

export function parseSavedDocument(
  value: unknown,
  payload: SaveAdminOperationalDocumentPayload,
  previousRevision: number | null,
  catalog: IAdminOperationalCatalog,
): IAdminOperationalDocumentDetail {
  const document = saveResponseReader(value, 'response').document;
  assertSavedFields(document, payload, 'response.document');
  if (payload.id === null) {
    assertEdgeContract(
      document.status === 'draft' && document.revision === 1,
      'response.document',
      'a new draft document at revision 1',
    );
  } else {
    assertEdgeContract(
      document.id === payload.id &&
        document.status !== 'archived' &&
        previousRevision !== null &&
        document.revision > previousRevision,
      'response.document',
      'the updated document with a newer revision',
    );
  }
  assertDetail(document, catalog, 'response.document');
  return document;
}

function assertListItem(
  document: IAdminOperationalDocumentListItem,
  path: string,
): void {
  const currentFields = [
    document.currentPublishedVersionId,
    document.currentPublishedVersionNumber,
    document.currentActionMode,
    document.currentPublishedAt,
  ];
  assertEdgeContract(
    currentFields.every((value) => value === null) ||
      currentFields.every((value) => value !== null),
    path,
    'all current published version fields set together or all null',
  );
  assertEdgeContract(
    document.status !== 'published' ||
      document.currentPublishedVersionId !== null,
    `${path}.currentPublishedVersionId`,
    'set for a published document',
  );
  if (document.unpublishedVersion !== null) {
    assertEdgeContract(
      document.unpublishedVersion.documentId === document.id,
      `${path}.unpublishedVersion.documentId`,
      'equal to the document id',
    );
  }
}

function assertDetail(
  document: IAdminOperationalDocumentDetail,
  catalog: IAdminOperationalCatalog,
  path: string,
): void {
  const currentVersion = document.currentPublishedVersion;
  assertEdgeContract(
    (document.currentPublishedVersionId === null) === (currentVersion === null),
    `${path}.currentPublishedVersion`,
    'null exactly when currentPublishedVersionId is null',
  );
  if (currentVersion !== null) {
    assertEdgeContract(
      currentVersion.documentId === document.id &&
        currentVersion.id === document.currentPublishedVersionId &&
        currentVersion.status === 'published',
      `${path}.currentPublishedVersion`,
      'the document current published version',
    );
    assertTargetRelations(
      currentVersion.targets,
      catalog,
      `${path}.currentPublishedVersion.targets`,
    );
  }
  assertEdgeContract(
    document.status !== 'published' || currentVersion !== null,
    `${path}.currentPublishedVersion`,
    'present for a published document',
  );
  document.versions.forEach((version, index) => {
    assertEdgeContract(
      version.documentId === document.id,
      `${path}.versions[${index}].documentId`,
      'equal to the document id',
    );
    assertTargetRelations(
      version.targets,
      catalog,
      `${path}.versions[${index}].targets`,
    );
  });
  assertEdgeArrayOrder(document.versions, compareVersions, `${path}.versions`);
  assertEdgeContract(
    new Set(document.versions.map((version) => version.id)).size ===
      document.versions.length &&
      new Set(document.versions.map((version) => version.versionNumber)).size ===
        document.versions.length,
    `${path}.versions`,
    'unique version ids and version numbers',
  );
  assertRecovery(document, path);
  if (currentVersion !== null) {
    assertEdgeContract(
      document.versions.some((version) => version.id === currentVersion.id),
      `${path}.versions`,
      'to contain the current published version',
    );
  }
}

function assertSavedFields(
  document: IAdminOperationalDocumentDetail,
  payload: SaveAdminOperationalDocumentPayload,
  path: string,
): void {
  const fields = ['code', 'title', 'description', 'category'] as const;
  fields.forEach((field) =>
    assertEdgeContract(
      document[field] === payload[field],
      `${path}.${field}`,
      'equal to the normalized save payload',
    ),
  );
}

function readOperationalCode(value: unknown, path: string): string {
  const code = readEdgeNonBlankString(value, path);
  assertEdgeContract(
    code.length <= COWORKER_DOCUMENT_SHELL_LIMITS.codeLength &&
      ADMIN_OPERATIONAL_DOCUMENT_CODE_PATTERN.test(code),
    path,
    'a valid operational document code',
  );
  return code;
}

function compareVersions(
  left: AdminOperationalStoredVersion,
  right: AdminOperationalStoredVersion,
): number {
  return right.versionNumber - left.versionNumber || compareText(left.id, right.id);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
