import { ICoworkerOperationalAssignment } from '../../interfaces/i-coworker-operational-document';
import {
  COWORKER_OPERATIONAL_ACTIONS,
  CoworkerOperationalAction,
  CoworkerOperationalAssignmentStatus,
} from '../../types/coworker-operational-document';

const STATUS_PRIORITY = {
  pending: 0,
  declined: 1,
  available: 2,
  acknowledged: 3,
  accepted: 3,
  waived: 4,
  expired: 5,
} as const satisfies Record<CoworkerOperationalAssignmentStatus, number>;

export function compareCoworkerOperationalAssignments(
  left: ICoworkerOperationalAssignment,
  right: ICoworkerOperationalAssignment,
): number {
  const statusDifference =
    STATUS_PRIORITY[left.status] - STATUS_PRIORITY[right.status];
  if (statusDifference !== 0) return statusDifference;

  if (left.dueAt === null && right.dueAt !== null) return 1;
  if (left.dueAt !== null && right.dueAt === null) return -1;
  if (left.dueAt !== null && right.dueAt !== null) {
    const deadlineDifference =
      new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    if (deadlineDifference !== 0) return deadlineDifference;
  }

  const assignmentDifference =
    new Date(right.assignedAt).getTime() - new Date(left.assignedAt).getTime();
  return assignmentDifference !== 0
    ? assignmentDifference
    : left.id.localeCompare(right.id);
}

export function getAvailableCoworkerOperationalActions(
  assignment: ICoworkerOperationalAssignment,
): readonly CoworkerOperationalAction[] {
  return COWORKER_OPERATIONAL_ACTIONS.filter((action) =>
    canPerformCoworkerOperationalAction(assignment, action),
  );
}

export function canPerformCoworkerOperationalAction(
  assignment: ICoworkerOperationalAssignment,
  action: CoworkerOperationalAction,
): boolean {
  if (!assignment.canAct) return false;
  if (
    action === 'acknowledged' &&
    assignment.actionMode !== 'acknowledgement_required'
  ) {
    return false;
  }
  if (
    action !== 'acknowledged' &&
    assignment.actionMode !== 'acceptance_required'
  ) {
    return false;
  }
  return assignment.statements.some(
    (statement) => statement.action === action,
  );
}
