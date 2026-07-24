import type {
  OperationalAction,
  OperationalAssignment,
} from "./operational-assignment-models.ts";

export function assertOperationalAssignmentInvariants(
  assignment: OperationalAssignment,
  createError: () => Error,
): void {
  requireContract(
    assignment.document.id === assignment.documentId &&
      assignment.version.id === assignment.documentVersionId,
    createError,
  );
  assertDocumentLifecycle(assignment, createError);
  assertAssignmentLifecycle(assignment, createError);
  assertStatements(assignment, createError);
  assertInheritedAssignment(assignment, createError);
  assertCurrentAction(assignment, createError);
  assertCanAct(assignment, createError);
}

function assertDocumentLifecycle(
  assignment: OperationalAssignment,
  createError: () => Error,
): void {
  if (assignment.document.status === "published") {
    requireContract(
      assignment.document.currentPublishedVersionId !== null,
      createError,
    );
  }
  if (
    assignment.version.status === "published" ||
    assignment.version.status === "superseded" ||
    assignment.version.status === "archived"
  ) {
    requireContract(assignment.version.publishedAt !== null, createError);
  }

  const expectedIsCurrentPublishedVersion =
    assignment.document.currentPublishedVersionId ===
      assignment.documentVersionId;
  requireContract(
    assignment.isCurrentPublishedVersion ===
      expectedIsCurrentPublishedVersion,
    createError,
  );

  const expectedDownloadAvailable = assignment.version.status === "published" ||
    assignment.version.status === "superseded" ||
    assignment.version.status === "archived";
  requireContract(
    assignment.downloadAvailable === expectedDownloadAvailable,
    createError,
  );
}

function assertAssignmentLifecycle(
  assignment: OperationalAssignment,
  createError: () => Error,
): void {
  requireContract(
    (assignment.acknowledgedAt !== null) ===
        (assignment.status === "acknowledged") &&
      (assignment.acceptedAt !== null) ===
        (assignment.status === "accepted") &&
      (assignment.declinedAt !== null) ===
        (assignment.status === "declined"),
    createError,
  );

  if (assignment.status === "declined") {
    requireContract(
      isNonBlankWithin(assignment.declineReason, 2000),
      createError,
    );
  } else {
    requireContract(assignment.declineReason === null, createError);
  }

  if (assignment.status === "waived") {
    requireContract(
      assignment.waivedAt !== null &&
        isNonBlank(assignment.waiverReason),
      createError,
    );
  } else {
    requireContract(
      assignment.waivedAt === null && assignment.waiverReason === null,
      createError,
    );
  }
}

function assertStatements(
  assignment: OperationalAssignment,
  createError: () => Error,
): void {
  const expectedActions: readonly OperationalAction[] =
    assignment.actionMode === "information_only"
      ? []
      : assignment.actionMode === "acknowledgement_required"
      ? ["acknowledged"]
      : ["accepted", "declined"];

  requireContract(
    assignment.statements.length === expectedActions.length &&
      assignment.statements.every(
        (statement, index) =>
          statement.action === expectedActions[index] &&
          statement.statementVersion === assignment.version.statementVersion,
      ),
    createError,
  );
}

function assertInheritedAssignment(
  assignment: OperationalAssignment,
  createError: () => Error,
): void {
  const isInherited = assignment.satisfiedByAssignmentId !== null;
  requireContract(
    assignment.satisfiedByPreviousVersion === isInherited &&
      (assignment.inheritedFrom !== null) === isInherited,
    createError,
  );
  if (assignment.inheritedFrom === null) {
    return;
  }

  const inherited = assignment.inheritedFrom;
  requireContract(
    inherited.assignmentId === assignment.satisfiedByAssignmentId &&
      inherited.assignmentId !== assignment.id &&
      inherited.documentVersionId !== assignment.documentVersionId &&
      inherited.versionNumber < assignment.version.versionNumber &&
      (assignment.status === "acknowledged" ||
        assignment.status === "accepted") &&
      inherited.status === assignment.status &&
      assignment.currentAction === null,
    createError,
  );

  requireContract(
    inherited.status === "acknowledged"
      ? inherited.acknowledgedAt !== null && inherited.acceptedAt === null
      : inherited.status === "accepted" &&
        inherited.acknowledgedAt === null &&
        inherited.acceptedAt !== null,
    createError,
  );
}

function assertCurrentAction(
  assignment: OperationalAssignment,
  createError: () => Error,
): void {
  const hasDirectAction = assignment.satisfiedByAssignmentId === null &&
    (
      assignment.status === "acknowledged" ||
      assignment.status === "accepted" ||
      assignment.status === "declined"
    );
  requireContract(
    (assignment.currentAction !== null) === hasDirectAction,
    createError,
  );
  if (assignment.currentAction === null) {
    return;
  }

  const currentAction = assignment.currentAction;
  const statement = assignment.statements.find(
    (item) => item.id === currentAction.statementId,
  );
  const actedAt = currentAction.action === "acknowledged"
    ? assignment.acknowledgedAt
    : currentAction.action === "accepted"
    ? assignment.acceptedAt
    : assignment.declinedAt;

  requireContract(
    currentAction.action === assignment.status &&
      currentAction.declineReason === assignment.declineReason &&
      statement !== undefined &&
      statement.action === currentAction.action &&
      statement.statementVersion === currentAction.statementVersion &&
      statement.sha256Base64 === currentAction.statementSha256Base64 &&
      statement.text === currentAction.statementText &&
      currentAction.actedAt === actedAt,
    createError,
  );
}

function assertCanAct(
  assignment: OperationalAssignment,
  createError: () => Error,
): void {
  const expectedCanAct = assignment.status === "pending" &&
    assignment.document.status === "published" &&
    assignment.document.currentPublishedVersionId ===
      assignment.documentVersionId &&
    assignment.version.status === "published";
  requireContract(assignment.canAct === expectedCanAct, createError);
}

function isNonBlank(value: string | null): value is string {
  return value !== null && value.trim() !== "";
}

function isNonBlankWithin(
  value: string | null,
  maximumLength: number,
): value is string {
  return isNonBlank(value) && value.length <= maximumLength;
}

function requireContract(
  condition: boolean,
  createError: () => Error,
): asserts condition {
  if (!condition) {
    throw createError();
  }
}
