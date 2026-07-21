import {
  IAdminOperationalCatalog,
  IAdminOperationalDocumentDetail,
  IAdminOperationalDocumentListItem,
} from '../../interfaces/i-admin-coworker-operational-document';
import { APP_ROLES } from '../../types/app-role';
import {
  ADMIN_OPERATIONAL_DOCUMENT_CODE_PATTERN,
} from '../../configs/admin-coworker-operational-documents.config';
import { COWORKER_DOCUMENT_SHELL_LIMITS } from '../../configs/coworker-documents.config';
import { ADMIN_OPERATIONAL_TARGET_KINDS } from '../../types/admin-coworker-operational-document';
import {
  COWORKER_OPERATIONAL_ACTION_MODES,
  COWORKER_OPERATIONAL_DOCUMENT_STATUSES,
} from '../../types/coworker-operational-document';
import { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLimitedTextReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeNonBlankString,
  readEdgeNullableBoolean,
  readEdgeNullableInteger,
  readEdgeNullableString,
  readEdgeNullableTimestamp,
  readEdgePositiveInteger,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  adminOperationalStoredVersionReader,
  adminOperationalUnpublishedVersionReader,
} from './admin-operational-version-readers';

const actionModeReader = createEdgeLiteralReader(
  COWORKER_OPERATIONAL_ACTION_MODES,
);
const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const titleReader = createEdgeLimitedTextReader(
  COWORKER_DOCUMENT_SHELL_LIMITS.titleLength,
  readEdgeNonBlankString,
);
const descriptionReader = createEdgeNullableReader(
  createEdgeLimitedTextReader(
    COWORKER_DOCUMENT_SHELL_LIMITS.descriptionLength,
  ),
);
const categoryReader = createEdgeLimitedTextReader(
  COWORKER_DOCUMENT_SHELL_LIMITS.categoryLength,
  readEdgeNonBlankString,
);

export const adminOperationalCatalogReader: EdgeReader<IAdminOperationalCatalog> =
  createEdgeObjectReader({
    actionModes: createEdgeArrayReader(actionModeReader),
    targetKinds: createEdgeArrayReader(
      createEdgeLiteralReader(ADMIN_OPERATIONAL_TARGET_KINDS),
    ),
    appRoles: createEdgeArrayReader(createEdgeLiteralReader(APP_ROLES)),
    coworkers: createEdgeArrayReader(
      createEdgeObjectReader({
        userId: readEdgeUuid,
        email: readEdgeNonBlankString,
        firstName: readEdgeNullableString,
        appRole: createEdgeLiteralReader(APP_ROLES),
        accessEnabled: readEdgeBoolean,
      }),
    ),
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
        public: readEdgeNullableBoolean,
        fileSizeLimit: readEdgeNullableInteger,
        allowedMimeTypes: createEdgeNullableReader(
          createEdgeArrayReader(readEdgeNonBlankString),
        ),
      }),
    ),
  });

const documentShellFieldReaders = {
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

export const adminOperationalDocumentListItemReader:
  EdgeReader<IAdminOperationalDocumentListItem> = createEdgeObjectReader({
    ...documentShellFieldReaders,
    currentPublishedVersionNumber: createEdgeNullableReader(
      readEdgePositiveInteger,
    ),
    currentActionMode: createEdgeNullableReader(actionModeReader),
    currentPublishedAt: readEdgeNullableTimestamp,
    unpublishedVersion: createEdgeNullableReader(
      adminOperationalUnpublishedVersionReader,
    ),
  });

export const adminOperationalDocumentDetailReader:
  EdgeReader<IAdminOperationalDocumentDetail> = createEdgeObjectReader({
    ...documentShellFieldReaders,
    currentPublishedVersion: createEdgeNullableReader(
      adminOperationalStoredVersionReader,
    ),
    versions: createEdgeArrayReader(adminOperationalStoredVersionReader),
    publishedAt: readEdgeNullableTimestamp,
    archivedAt: readEdgeNullableTimestamp,
  });

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
