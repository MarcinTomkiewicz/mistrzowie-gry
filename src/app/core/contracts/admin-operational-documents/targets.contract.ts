import type { IAdminOperationalCatalog } from '../../interfaces/i-admin-operational-catalog';
import { APP_ROLES } from '../../types/app-role';
import {
  ADMIN_OPERATIONAL_TARGET_KINDS,
  type AdminOperationalTarget,
  type AdminOperationalTargetKeySource,
} from '../../types/admin-operational-version';
import type { EdgeReader } from '../../types/edge-contract';
import {
  assertEdgeContract,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeTimestamp,
  readEdgeUuid,
} from '../../utils/edge-contract';

const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const targetObjectReader = createEdgeObjectReader({
  id: readEdgeUuid,
  targetKind: createEdgeLiteralReader(ADMIN_OPERATIONAL_TARGET_KINDS),
  appRole: createEdgeNullableReader(createEdgeLiteralReader(APP_ROLES)),
  userId: nullableUuidReader,
  eventDefinitionId: nullableUuidReader,
  createdAt: readEdgeTimestamp,
});

export const targetReader: EdgeReader<AdminOperationalTarget> =
  (value, path) => {
    const target = targetObjectReader(value, path);
    switch (target.targetKind) {
      case 'all_active_coworkers':
        assertSelectors(target, path, false, false, false);
        return {
          ...target,
          targetKind: 'all_active_coworkers',
          appRole: null,
          userId: null,
          eventDefinitionId: null,
        };
      case 'app_role':
        assertSelectors(target, path, true, false, false);
        return {
          ...target,
          targetKind: 'app_role',
          appRole: requiredSelector(target.appRole, path),
          userId: null,
          eventDefinitionId: null,
        };
      case 'user':
        assertSelectors(target, path, false, true, false);
        return {
          ...target,
          targetKind: 'user',
          appRole: null,
          userId: requiredSelector(target.userId, path),
          eventDefinitionId: null,
        };
      case 'event_definition':
        assertSelectors(target, path, false, false, true);
        return {
          ...target,
          targetKind: 'event_definition',
          appRole: null,
          userId: null,
          eventDefinitionId: requiredSelector(target.eventDefinitionId, path),
        };
    }
  };

export function targetKey(
  target: AdminOperationalTargetKeySource,
): string {
  return JSON.stringify([
    target.targetKind,
    target.appRole,
    target.userId,
    target.eventDefinitionId,
  ]);
}

export function assertTargetRelations(
  targets: readonly AdminOperationalTarget[],
  catalog: IAdminOperationalCatalog,
  path: string,
): void {
  targets.forEach((target, index) => {
    const targetPath = `${path}[${index}]`;
    if (target.targetKind === 'app_role') {
      assertEdgeContract(
        catalog.appRoles.includes(target.appRole),
        `${targetPath}.appRole`,
        'an application role present in the catalog',
      );
    }
    if (target.targetKind === 'user') {
      assertEdgeContract(
        catalog.coworkers.some(
          (coworker) => coworker.userId === target.userId,
        ),
        `${targetPath}.userId`,
        'a coworker present in the catalog',
      );
    }
    if (target.targetKind === 'event_definition') {
      assertEdgeContract(
        catalog.eventDefinitions.some(
          (event) => event.id === target.eventDefinitionId,
        ),
        `${targetPath}.eventDefinitionId`,
        'an event definition present in the catalog',
      );
    }
  });
}

export function compareTargets(
  left: AdminOperationalTarget,
  right: AdminOperationalTarget,
): number {
  return compareText(left.targetKind, right.targetKind) ||
    compareNullable(left.appRole, right.appRole) ||
    compareNullable(left.userId, right.userId) ||
    compareNullable(left.eventDefinitionId, right.eventDefinitionId) ||
    compareText(left.id, right.id);
}

function assertSelectors(
  target: ReturnType<typeof targetObjectReader>,
  path: string,
  hasRole: boolean,
  hasUser: boolean,
  hasEvent: boolean,
): void {
  assertEdgeContract(
    (target.appRole !== null) === hasRole &&
      (target.userId !== null) === hasUser &&
      (target.eventDefinitionId !== null) === hasEvent,
    path,
    'exactly the selector required by targetKind',
  );
}

function requiredSelector<T>(value: T | null, path: string): T {
  assertEdgeContract(value !== null, path, 'the selector required by targetKind');
  return value;
}

function compareNullable(left: string | null, right: string | null): number {
  if (left === null) return right === null ? 0 : -1;
  return right === null ? 1 : compareText(left, right);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
