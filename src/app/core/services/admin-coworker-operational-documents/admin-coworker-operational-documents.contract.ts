import {
  IAdminOperationalCatalog,
  IAdminOperationalDashboard,
  IAdminOperationalDocumentDetail,
  IAdminOperationalDocumentListItem,
  IAdminOperationalStoredVersion,
} from '../../interfaces/i-admin-coworker-operational-document';
import {
  ADMIN_OPERATIONAL_EDGE_ACTION,
  ADMIN_OPERATIONAL_TARGET_KINDS,
  SaveAdminOperationalDocumentPayload,
} from '../../types/admin-coworker-operational-document';
import { COWORKER_OPERATIONAL_ACTION_MODES } from '../../types/coworker-operational-document';
import {
  assertEdgeArrayOrder,
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeObjectReader,
} from '../../utils/edge-contract';
import {
  adminOperationalCatalogReader,
  adminOperationalDocumentDetailReader,
  adminOperationalDocumentListItemReader,
} from './admin-operational-model-readers';
import { assertOperationalTargetRelations } from './admin-operational-target-relations';

const trueReader = createEdgeLiteralReader([true] as const);

const dashboardResponseReader = createEdgeObjectReader({
  ok: trueReader,
  catalog: adminOperationalCatalogReader,
  documents: createEdgeArrayReader(adminOperationalDocumentListItemReader),
});

const detailResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.getDocumentDetail,
  ] as const),
  document: adminOperationalDocumentDetailReader,
});

const saveResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.saveDocument,
  ] as const),
  document: adminOperationalDocumentDetailReader,
});

export function parseAdminOperationalDashboard(
  value: unknown,
): IAdminOperationalDashboard {
  const dashboard = dashboardResponseReader(value, 'response');
  assertCatalogContract(dashboard.catalog, 'response.catalog');
  dashboard.documents.forEach((document, index) => {
    const path = `response.documents[${index}]`;
    assertListItemContract(document, path);
    if (document.unpublishedVersion !== null) {
      assertOperationalTargetRelations(
        document.unpublishedVersion,
        dashboard.catalog,
        `${path}.unpublishedVersion`,
      );
    }
  });
  return dashboard;
}

export function parseAdminOperationalDetail(
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
  assertDetailContract(document, catalog, 'response.document');
  return document;
}

export function parseSavedAdminOperationalDocument(
  value: unknown,
  payload: SaveAdminOperationalDocumentPayload,
  previousRevision: number | null,
  catalog: IAdminOperationalCatalog,
): IAdminOperationalDocumentDetail {
  const document = saveResponseReader(value, 'response').document;
  assertSavedFields(document, payload, 'response.document');
  if (payload.id === null) {
    assertEdgeContract(
      document.status === 'draft',
      'response.document.status',
      'draft for a newly created document',
    );
    assertEdgeContract(
      document.revision === 1,
      'response.document.revision',
      '1 for a newly created document',
    );
  } else {
    assertEdgeContract(
      document.id === payload.id,
      'response.document.id',
      'equal to the saved document id',
    );
    assertEdgeContract(
      document.status !== 'archived',
      'response.document.status',
      'not archived after a successful update',
    );
    assertEdgeContract(
      previousRevision !== null && document.revision > previousRevision,
      'response.document.revision',
      'greater than the previously loaded revision',
    );
  }
  assertDetailContract(document, catalog, 'response.document');
  return document;
}

function assertCatalogContract(
  catalog: IAdminOperationalCatalog,
  path: string,
): void {
  assertExactValues(
    catalog.actionModes,
    COWORKER_OPERATIONAL_ACTION_MODES,
    `${path}.actionModes`,
  );
  assertExactValues(
    catalog.targetKinds,
    ADMIN_OPERATIONAL_TARGET_KINDS,
    `${path}.targetKinds`,
  );
  assertEdgeContract(
    new Set(catalog.appRoles).size === catalog.appRoles.length,
    `${path}.appRoles`,
    'unique application roles',
  );
  assertEdgeArrayOrder(
    catalog.appRoles,
    compareText,
    `${path}.appRoles`,
  );
}

function assertListItemContract(
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

function assertDetailContract(
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
      currentVersion.documentId === document.id,
      `${path}.currentPublishedVersion.documentId`,
      'equal to the document id',
    );
    assertEdgeContract(
      currentVersion.id === document.currentPublishedVersionId,
      `${path}.currentPublishedVersion.id`,
      'equal to currentPublishedVersionId',
    );
    assertEdgeContract(
      currentVersion.status === 'published',
      `${path}.currentPublishedVersion.status`,
      'published',
    );
    assertOperationalTargetRelations(
      currentVersion,
      catalog,
      `${path}.currentPublishedVersion`,
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
    assertOperationalTargetRelations(
      version,
      catalog,
      `${path}.versions[${index}]`,
    );
  });
  assertEdgeArrayOrder(document.versions, compareVersions, `${path}.versions`);
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

function compareVersions(
  left: IAdminOperationalStoredVersion,
  right: IAdminOperationalStoredVersion,
): number {
  return right.versionNumber - left.versionNumber || compareText(left.id, right.id);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertExactValues(
  actual: readonly string[],
  expected: readonly string[],
  path: string,
): void {
  assertEdgeContract(
    actual.length === expected.length &&
      actual.every((value, index) => value === expected[index]),
    path,
    'the exact frozen catalog sequence',
  );
}
