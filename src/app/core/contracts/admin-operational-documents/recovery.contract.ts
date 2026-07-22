import type { IAdminOperationalDocumentDetail } from '../../interfaces/i-admin-operational-document';
import {
  ADMIN_OPERATIONAL_CLEANUP_STATUSES,
  type AdminOperationalUploadRecovery,
  OPERATIONAL_RECOVERY_VERSION_STATUSES,
  OPERATIONAL_UPLOAD_SESSION_STATUSES,
} from '../../types/admin-operational-upload';
import type { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeObjectReader,
  readEdgeBoolean,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';

const ACTIVE_VERSION_STATUSES = [
  'reserved',
  'uploaded',
  'ready',
  'failed',
] as const;
const RECOVERABLE_VERSION_STATUSES = [
  'reserved',
  'uploaded',
  'failed',
] as const;

export const recoveryReader:
  EdgeReader<AdminOperationalUploadRecovery> = createEdgeObjectReader({
    uploadSessionId: readEdgeUuid,
    documentVersionId: readEdgeUuid,
    sessionStatus: createEdgeLiteralReader(
      OPERATIONAL_UPLOAD_SESSION_STATUSES,
    ),
    versionStatus: createEdgeLiteralReader(
      OPERATIONAL_RECOVERY_VERSION_STATUSES,
    ),
    expiresAt: readEdgeTimestamp,
    expired: readEdgeBoolean,
    cleanupStatus: createEdgeLiteralReader(ADMIN_OPERATIONAL_CLEANUP_STATUSES),
    canFinalize: readEdgeBoolean,
    canCancel: readEdgeBoolean,
  });

export function assertRecovery(
  document: IAdminOperationalDocumentDetail,
  path: string,
): void {
  const activeVersions = document.versions.filter((version) =>
    ACTIVE_VERSION_STATUSES.some((status) => status === version.status),
  );
  const recoverableVersions = document.versions.filter((version) =>
    RECOVERABLE_VERSION_STATUSES.some((status) => status === version.status),
  );
  assertEdgeContract(
    activeVersions.length <= 1,
    `${path}.versions`,
    'at most one active preparing version',
  );

  const recovery = document.uploadRecovery;
  if (recovery === null) {
    assertEdgeContract(
      recoverableVersions.length === 0,
      `${path}.uploadRecovery`,
      'recovery for every reserved, uploaded, or failed version',
    );
    return;
  }

  const version = document.versions.find(
    (item) => item.id === recovery.documentVersionId,
  );
  assertEdgeContract(
    version !== undefined,
    `${path}.uploadRecovery.documentVersionId`,
    'a version present in document.versions',
  );

  assertEdgeContract(
    version.documentId === document.id &&
      version.status === recovery.versionStatus,
    `${path}.uploadRecovery.versionStatus`,
    'the exact correlated document version status',
  );
  assertEdgeContract(
    recovery.canCancel,
    `${path}.uploadRecovery.canCancel`,
    'true for every exposed recovery',
  );
  assertEdgeContract(
    recovery.cleanupStatus !== 'completed',
    `${path}.uploadRecovery.cleanupStatus`,
    'an incomplete cleanup state',
  );

  const expectedCanFinalize =
    (recovery.sessionStatus === 'created' ||
      recovery.sessionStatus === 'uploaded') &&
    !recovery.expired &&
    recovery.versionStatus === 'reserved';
  assertEdgeContract(
    recovery.canFinalize === expectedCanFinalize,
    `${path}.uploadRecovery.canFinalize`,
    'the exact derived finalization capability',
  );
  if (recovery.sessionStatus === 'expired') {
    assertEdgeContract(
      recovery.expired,
      `${path}.uploadRecovery.expired`,
      'true for a read-model expired session',
    );
  }
  if (recovery.sessionStatus === 'cancelled') {
    assertEdgeContract(
      recovery.versionStatus === 'deleted' &&
        !recovery.canFinalize &&
        (recovery.cleanupStatus === 'pending' ||
          recovery.cleanupStatus === 'failed'),
      `${path}.uploadRecovery`,
      'the documented cancelled cleanup retry state',
    );
  }
  assertEdgeContract(
    recovery.versionStatus === 'deleted'
      ? activeVersions.length === 0
      : activeVersions.length === 1 && activeVersions[0].id === version.id,
    `${path}.uploadRecovery`,
    recovery.versionStatus === 'deleted'
      ? 'no active preparing version beside deleted recovery'
      : 'the sole active preparing version correlated with recovery',
  );
}
