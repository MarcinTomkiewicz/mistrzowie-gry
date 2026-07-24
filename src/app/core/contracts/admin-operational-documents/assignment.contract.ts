import type {
  AdminOperationalTargetProvenance,
  IAdminOperationalAssignmentListItem,
} from '../../interfaces/i-admin-operational-assignment';
import type { ICoworkerOperationalAssignment } from '../../interfaces/i-coworker-operational-document';
import { APP_ROLES } from '../../types/app-role';
import { ADMIN_OPERATIONAL_EDGE_ACTION } from '../../types/admin-operational-document';
import {
  ADMIN_OPERATIONAL_TARGET_KINDS,
} from '../../types/admin-operational-version';
import {
  assertEdgeContract,
  createEdgeArrayReader,
  createEdgeLiteralReader,
  createEdgeNullableReader,
  createEdgeObjectReader,
  readEdgeUuid,
} from '../../utils/edge-contract';
import {
  coworkerOperationalAssignmentReader,
} from '../../services/coworker-operational-documents/coworker-operational-documents.contract';
import { adminOperationalCoworkerOptionReader } from './catalog.contract';

const trueReader = createEdgeLiteralReader([true] as const);
const nullableUuidReader = createEdgeNullableReader(readEdgeUuid);
const nullableAppRoleReader = createEdgeNullableReader(
  createEdgeLiteralReader(APP_ROLES),
);

const targetProvenanceObjectReader = createEdgeObjectReader({
  targetId: readEdgeUuid,
  targetKind: createEdgeLiteralReader(ADMIN_OPERATIONAL_TARGET_KINDS),
  appRole: nullableAppRoleReader,
  userId: nullableUuidReader,
  eventDefinitionId: nullableUuidReader,
});

const assignmentListItemReader = createEdgeObjectReader({
  user: adminOperationalCoworkerOptionReader,
  assignment: coworkerOperationalAssignmentReader,
  targetProvenance: createEdgeArrayReader(readTargetProvenance),
});

const assignmentListResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.getAssignmentList,
  ] as const),
  assignments: createEdgeArrayReader(assignmentListItemReader),
});

const waivedAssignmentResponseReader = createEdgeObjectReader({
  ok: trueReader,
  action: createEdgeLiteralReader([
    ADMIN_OPERATIONAL_EDGE_ACTION.waiveAssignment,
  ] as const),
  assignment: coworkerOperationalAssignmentReader,
});

export function parseAssignmentList(
  value: unknown,
  documentVersionId: string,
): IAdminOperationalAssignmentListItem[] {
  const assignments = assignmentListResponseReader(
    value,
    'response',
  ).assignments;

  assignments.forEach((item, index) => {
    const path = `response.assignments[${index}]`;
    assertEdgeContract(
      item.assignment.documentVersionId === documentVersionId,
      `${path}.assignment.documentVersionId`,
      'equal to the requested documentVersionId',
    );
    assertEdgeContract(
      item.assignment.userId === item.user.userId,
      `${path}.user.userId`,
      'equal to assignment.userId',
    );
    assertEdgeContract(
      new Set(item.targetProvenance.map((target) => target.targetId)).size ===
        item.targetProvenance.length,
      `${path}.targetProvenance`,
      'unique target ids',
    );
  });

  assertEdgeContract(
    new Set(assignments.map((item) => item.assignment.id)).size ===
      assignments.length,
    'response.assignments',
    'unique assignment ids',
  );

  return assignments;
}

export function parseWaivedAssignment(
  value: unknown,
  assignmentId: string,
): ICoworkerOperationalAssignment {
  const assignment = waivedAssignmentResponseReader(
    value,
    'response',
  ).assignment;
  assertEdgeContract(
    assignment.id === assignmentId &&
      assignment.status === 'waived' &&
      assignment.waivedAt !== null &&
      assignment.waiverReason !== null &&
      assignment.waiverReason.trim() !== '',
    'response.assignment',
    'the requested waived assignment with waiver evidence',
  );
  return assignment;
}

function readTargetProvenance(
  value: unknown,
  path: string,
): AdminOperationalTargetProvenance {
  const target = targetProvenanceObjectReader(value, path);
  if (
    target.targetKind === 'all_active_coworkers' &&
    target.appRole === null &&
    target.userId === null &&
    target.eventDefinitionId === null
  ) {
    return {
      targetId: target.targetId,
      targetKind: 'all_active_coworkers',
      appRole: null,
      userId: null,
      eventDefinitionId: null,
    };
  }
  if (
    target.targetKind === 'app_role' &&
    target.appRole !== null &&
    target.userId === null &&
    target.eventDefinitionId === null
  ) {
    return {
      targetId: target.targetId,
      targetKind: 'app_role',
      appRole: target.appRole,
      userId: null,
      eventDefinitionId: null,
    };
  }
  if (
    target.targetKind === 'user' &&
    target.appRole === null &&
    target.userId !== null &&
    target.eventDefinitionId === null
  ) {
    return {
      targetId: target.targetId,
      targetKind: 'user',
      appRole: null,
      userId: target.userId,
      eventDefinitionId: null,
    };
  }
  if (
    target.targetKind === 'event_definition' &&
    target.appRole === null &&
    target.userId === null &&
    target.eventDefinitionId !== null
  ) {
    return {
      targetId: target.targetId,
      targetKind: 'event_definition',
      appRole: null,
      userId: null,
      eventDefinitionId: target.eventDefinitionId,
    };
  }
  assertEdgeContract(false, path, 'a selector matching targetKind');
}
