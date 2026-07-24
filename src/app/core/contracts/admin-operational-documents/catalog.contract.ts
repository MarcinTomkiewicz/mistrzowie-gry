import { COWORKER_DOCUMENTS_STORAGE } from '../../configs/coworker-documents.config';
import type { IAdminOperationalCatalog } from '../../interfaces/i-admin-operational-catalog';
import { APP_ROLES } from '../../types/app-role';
import { ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES } from '../../types/admin-operational-upload';
import { ADMIN_OPERATIONAL_TARGET_KINDS } from '../../types/admin-operational-version';
import { COWORKER_OPERATIONAL_ACTION_MODES } from '../../types/coworker-operational-document';
import type { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeArrayOrder,
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeNonBlankString,
  readEdgeNullableString,
  readEdgePositiveInteger,
  readEdgeUuid,
} from '../../utils/edge-contract';

const falseReader = createEdgeLiteralReader([false] as const);

export const adminOperationalCoworkerOptionReader =
  createEdgeObjectReader({
    userId: readEdgeUuid,
    email: readEdgeNonBlankString,
    firstName: readEdgeNullableString,
    appRole: createEdgeLiteralReader(APP_ROLES),
    accessEnabled: readEdgeBoolean,
  });

export const catalogReader:
  EdgeReader<IAdminOperationalCatalog> = createEdgeObjectReader({
    actionModes: createEdgeArrayReader(
      createEdgeLiteralReader(COWORKER_OPERATIONAL_ACTION_MODES),
    ),
    targetKinds: createEdgeArrayReader(
      createEdgeLiteralReader(ADMIN_OPERATIONAL_TARGET_KINDS),
    ),
    appRoles: createEdgeArrayReader(createEdgeLiteralReader(APP_ROLES)),
    coworkers: createEdgeArrayReader(adminOperationalCoworkerOptionReader),
    eventDefinitions: createEdgeArrayReader(
      createEdgeObjectReader({
        id: readEdgeUuid,
        key: readEdgeNonBlankString,
        name: readEdgeNonBlankString,
        isActive: readEdgeBoolean,
      }),
    ),
    storage: createEdgeNullableReader(
      createEdgeObjectReader({
        bucket: readEdgeNonBlankString,
        public: falseReader,
        fileSizeLimit: readEdgePositiveInteger,
        allowedMimeTypes: createEdgeArrayReader(
          createEdgeLiteralReader(ADMIN_OPERATIONAL_UPLOAD_MIME_TYPES),
        ),
      }),
    ),
  });

export function assertCatalog(
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
  assertEdgeArrayOrder(catalog.appRoles, compareText, `${path}.appRoles`);
  const storage = catalog.storage;
  if (storage === null) return;
  assertEdgeContract(
    storage.bucket === COWORKER_DOCUMENTS_STORAGE.bucket &&
      storage.public === false &&
      storage.fileSizeLimit <= COWORKER_DOCUMENTS_STORAGE.maxFileSizeBytes &&
      storage.allowedMimeTypes.length > 0 &&
      new Set(storage.allowedMimeTypes).size === storage.allowedMimeTypes.length,
    `${path}.storage`,
    'the frozen private coworker-documents Storage configuration',
  );
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

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
