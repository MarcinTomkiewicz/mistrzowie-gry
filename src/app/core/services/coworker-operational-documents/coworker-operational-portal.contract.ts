import { compareCoworkerOperationalAssignments } from '../../domain/coworker-operational-documents/assignments';
import { ICoworkerOperationalPortal } from '../../interfaces/i-coworker-operational-document';
import { assertEdgeContract } from '../../utils/edge-contract';

export function assertOperationalPortalContract(
  portal: ICoworkerOperationalPortal,
  path: string,
): void {
  assertEdgeContract(
    portal.assignments.every((assignment) => assignment.userId === portal.userId),
    `${path}.assignments`,
    `owned by ${path}.userId`,
  );
  assertEdgeContract(
    portal.assignments.every((assignment, index) => {
      const previous = portal.assignments[index - 1];
      return previous === undefined ||
        compareCoworkerOperationalAssignments(previous, assignment) <= 0;
    }),
    `${path}.assignments`,
    'ordered by status, dueAt, assignedAt and id',
  );
  assertEdgeContract(
    portal.notifications.every((notification, index) => {
      const previous = portal.notifications[index - 1];
      return previous === undefined ||
        compareOperationalNotifications(previous, notification) <= 0;
    }),
    `${path}.notifications`,
    'ordered by createdAt DESC and id DESC',
  );
}

function compareOperationalNotifications(
  left: ICoworkerOperationalPortal['notifications'][number],
  right: ICoworkerOperationalPortal['notifications'][number],
): number {
  const createdAtDifference =
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  return createdAtDifference !== 0
    ? createdAtDifference
    : right.id.localeCompare(left.id);
}
