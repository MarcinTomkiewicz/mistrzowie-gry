import { COWORKER_OPERATIONAL_DOCUMENT_LIMITS } from '../../configs/coworker-operational-documents.config';
import { ICoworkerOperationalAssignment } from '../../interfaces/i-coworker-operational-document';
import { CoworkerOperationalAction } from '../../types/coworker-operational-document';
import { assertEdgeContract } from '../../utils/edge-contract';

export function assertOperationalAssignmentContract(
  assignment: ICoworkerOperationalAssignment,
  path: string,
): void {
  assertDocumentLifecycle(assignment, path);
  assertAssignmentLifecycle(assignment, path);
  assertAssignmentStatements(assignment, path);
  assertInheritedAssignment(assignment, path);
  assertCurrentAction(assignment, path);
  assertCanAct(assignment, path);
}

function assertDocumentLifecycle(
  assignment: ICoworkerOperationalAssignment,
  path: string,
): void {
  if (assignment.document.status === 'published') {
    assertEdgeContract(
      assignment.document.currentPublishedVersionId !== null,
      `${path}.document.currentPublishedVersionId`,
      'a UUID for a published document',
    );
  }

  if (
    assignment.version.status === 'published' ||
    assignment.version.status === 'superseded' ||
    assignment.version.status === 'archived'
  ) {
    assertEdgeContract(
      assignment.version.publishedAt !== null,
      `${path}.version.publishedAt`,
      `a timestamp for version status ${assignment.version.status}`,
    );
  }

  const pointsToCurrentPublishedVersion =
    assignment.document.currentPublishedVersionId ===
      assignment.documentVersionId;
  assertEdgeContract(
    assignment.isCurrentPublishedVersion === pointsToCurrentPublishedVersion,
    `${path}.isCurrentPublishedVersion`,
    'consistent with the document current version id',
  );

  const downloadAvailable =
    assignment.version.status === 'published' ||
    assignment.version.status === 'superseded' ||
    assignment.version.status === 'archived';
  assertEdgeContract(
    assignment.downloadAvailable === downloadAvailable,
    `${path}.downloadAvailable`,
    'consistent with the version lifecycle',
  );
}

function assertAssignmentLifecycle(
  assignment: ICoworkerOperationalAssignment,
  path: string,
): void {
  assertEdgeContract(
    (assignment.acknowledgedAt !== null) ===
      (assignment.status === 'acknowledged'),
    `${path}.acknowledgedAt`,
    'set only for acknowledged status',
  );
  assertEdgeContract(
    (assignment.acceptedAt !== null) === (assignment.status === 'accepted'),
    `${path}.acceptedAt`,
    'set only for accepted status',
  );
  assertEdgeContract(
    (assignment.declinedAt !== null) === (assignment.status === 'declined'),
    `${path}.declinedAt`,
    'set only for declined status',
  );

  if (assignment.status === 'declined') {
    assertEdgeContract(
      assignment.declineReason !== null &&
        assignment.declineReason.trim() !== '' &&
        assignment.declineReason.length <=
          COWORKER_OPERATIONAL_DOCUMENT_LIMITS.declineReasonLength,
      `${path}.declineReason`,
      'a non-blank decline reason within the configured limit',
    );
  } else {
    assertEdgeContract(
      assignment.declineReason === null,
      `${path}.declineReason`,
      'null outside declined status',
    );
  }

  if (assignment.status === 'waived') {
    assertEdgeContract(
      assignment.waivedAt !== null,
      `${path}.waivedAt`,
      'a timestamp for waived status',
    );
    assertEdgeContract(
      assignment.waiverReason !== null &&
        assignment.waiverReason.trim() !== '',
      `${path}.waiverReason`,
      'a non-blank reason for waived status',
    );
  } else {
    assertEdgeContract(
      assignment.waivedAt === null && assignment.waiverReason === null,
      `${path}.waivedAt`,
      'null together with waiverReason outside waived status',
    );
  }
}

function assertAssignmentStatements(
  assignment: ICoworkerOperationalAssignment,
  path: string,
): void {
  const expectedActions: readonly CoworkerOperationalAction[] =
    assignment.actionMode === 'information_only'
      ? []
      : assignment.actionMode === 'acknowledgement_required'
        ? ['acknowledged']
        : ['accepted', 'declined'];

  assertEdgeContract(
    assignment.statements.length === expectedActions.length &&
      assignment.statements.every(
        (statement, index) => statement.action === expectedActions[index],
      ),
    `${path}.statements`,
    `the ordered statement set for ${assignment.actionMode}`,
  );
  assertEdgeContract(
    assignment.statements.every(
      (statement) =>
        statement.statementVersion === assignment.version.statementVersion,
    ),
    `${path}.statements`,
    'statements matching version.statementVersion',
  );
}

function assertInheritedAssignment(
  assignment: ICoworkerOperationalAssignment,
  path: string,
): void {
  const isInherited = assignment.satisfiedByAssignmentId !== null;
  assertEdgeContract(
    assignment.satisfiedByPreviousVersion === isInherited,
    `${path}.satisfiedByPreviousVersion`,
    'consistent with satisfiedByAssignmentId',
  );
  assertEdgeContract(
    (assignment.inheritedFrom !== null) === isInherited,
    `${path}.inheritedFrom`,
    'consistent with satisfiedByAssignmentId',
  );
  if (assignment.inheritedFrom === null) return;

  const inheritedFrom = assignment.inheritedFrom;
  assertEdgeContract(
    inheritedFrom.assignmentId === assignment.satisfiedByAssignmentId &&
      inheritedFrom.assignmentId !== assignment.id,
    `${path}.inheritedFrom.assignmentId`,
    'the distinct assignment referenced by satisfiedByAssignmentId',
  );
  assertEdgeContract(
    inheritedFrom.documentVersionId !== assignment.documentVersionId &&
      inheritedFrom.versionNumber < assignment.version.versionNumber,
    `${path}.inheritedFrom.documentVersionId`,
    'an earlier document version',
  );
  assertEdgeContract(
    assignment.status === 'acknowledged' || assignment.status === 'accepted',
    `${path}.status`,
    'acknowledged or accepted for inherited satisfaction',
  );
  assertEdgeContract(
    inheritedFrom.status === assignment.status,
    `${path}.inheritedFrom.status`,
    'equal to the inherited assignment status',
  );
  assertEdgeContract(
    assignment.currentAction === null,
    `${path}.currentAction`,
    'null for an inherited assignment',
  );

  if (inheritedFrom.status === 'acknowledged') {
    assertEdgeContract(
      inheritedFrom.acknowledgedAt !== null &&
        inheritedFrom.acceptedAt === null,
      `${path}.inheritedFrom.acknowledgedAt`,
      'set only for inherited acknowledged status',
    );
  } else {
    assertEdgeContract(
      inheritedFrom.status === 'accepted' &&
        inheritedFrom.acknowledgedAt === null &&
        inheritedFrom.acceptedAt !== null,
      `${path}.inheritedFrom.acceptedAt`,
      'set only for inherited accepted status',
    );
  }
}

function assertCurrentAction(
  assignment: ICoworkerOperationalAssignment,
  path: string,
): void {
  const hasDirectAction =
    assignment.satisfiedByAssignmentId === null &&
    (
      assignment.status === 'acknowledged' ||
      assignment.status === 'accepted' ||
      assignment.status === 'declined'
    );
  assertEdgeContract(
    (assignment.currentAction !== null) === hasDirectAction,
    `${path}.currentAction`,
    'present exactly for a directly recorded final action',
  );
  if (assignment.currentAction === null) return;

  const currentAction = assignment.currentAction;
  assertEdgeContract(
    currentAction.action === assignment.status,
    `${path}.currentAction.action`,
    'equal to assignment status',
  );
  assertEdgeContract(
    currentAction.declineReason === assignment.declineReason,
    `${path}.currentAction.declineReason`,
    'equal to assignment declineReason',
  );

  const statement = assignment.statements.find(
    (item) => item.id === currentAction.statementId,
  );
  assertEdgeContract(
    statement !== undefined &&
      statement.action === currentAction.action &&
      statement.statementVersion === currentAction.statementVersion &&
      statement.sha256Base64 === currentAction.statementSha256Base64 &&
      statement.text === currentAction.statementText,
    `${path}.currentAction.statementId`,
    'a statement snapshot matching the assigned version',
  );

  const actedAt = currentAction.action === 'acknowledged'
    ? assignment.acknowledgedAt
    : currentAction.action === 'accepted'
      ? assignment.acceptedAt
      : assignment.declinedAt;
  assertEdgeContract(
    currentAction.actedAt === actedAt,
    `${path}.currentAction.actedAt`,
    'equal to the assignment action timestamp',
  );
}

function assertCanAct(
  assignment: ICoworkerOperationalAssignment,
  path: string,
): void {
  const expectedCanAct =
    assignment.status === 'pending' &&
    assignment.document.status === 'published' &&
    assignment.document.currentPublishedVersionId ===
      assignment.documentVersionId &&
    assignment.version.status === 'published';
  assertEdgeContract(
    assignment.canAct === expectedCanAct,
    `${path}.canAct`,
    'consistent with assignment, document and version lifecycle',
  );
}
