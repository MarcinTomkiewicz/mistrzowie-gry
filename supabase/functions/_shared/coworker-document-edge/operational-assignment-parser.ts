import { createContractReaders } from "./contract-readers.ts";
import { createOperationalAssignmentEvidenceParsers } from "./operational-assignment-evidence-parser.ts";
import { assertOperationalAssignmentInvariants } from "./operational-assignment-invariants.ts";
import { createOperationalAssignmentMetadataParsers } from "./operational-assignment-metadata-parser.ts";
import {
  OPERATIONAL_ACTION_MODES,
  OPERATIONAL_ASSIGNMENT_SOURCES,
  OPERATIONAL_ASSIGNMENT_STATUSES,
  type OperationalAssignment,
  type OperationalAssignmentBase,
} from "./operational-assignment-models.ts";

const ASSIGNMENT_KEYS = [
  "id",
  "userId",
  "documentId",
  "documentVersionId",
  "assignmentSource",
  "actionMode",
  "status",
  "assignedAt",
  "dueAt",
  "acknowledgedAt",
  "acceptedAt",
  "declinedAt",
  "declineReason",
  "waivedAt",
  "waiverReason",
  "satisfiedByAssignmentId",
  "satisfiedByPreviousVersion",
  "document",
  "version",
  "statements",
  "currentAction",
  "inheritedFrom",
  "isCurrentPublishedVersion",
  "canAct",
  "downloadAvailable",
  "createdAt",
  "updatedAt",
] as const;

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

type AssignmentShape = OperationalAssignmentBase & {
  actionMode: typeof OPERATIONAL_ACTION_MODES[number];
  status: typeof OPERATIONAL_ASSIGNMENT_STATUSES[number];
};

export function createOperationalAssignmentParser<Context>(
  readers: ContractReaders<Context>,
  createBackendError: (context: Context) => Error,
) {
  const {
    backendArrayValue,
    backendBoolean,
    backendEnum,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendTimestamp,
    backendUuid,
  } = readers;
  const {
    parseCurrentAction,
    parseInheritedAssignment,
    parseStatement,
  } = createOperationalAssignmentEvidenceParsers(readers, createBackendError);
  const {
    parseDocument,
    parseVersion,
  } = createOperationalAssignmentMetadataParsers(readers);

  function parseOperationalAssignment(
    value: unknown,
    context: Context,
  ): OperationalAssignment {
    const source = backendObject(value, context, ASSIGNMENT_KEYS);
    const shape: AssignmentShape = {
      id: backendUuid(source, "id", context),
      userId: backendUuid(source, "userId", context),
      documentId: backendUuid(source, "documentId", context),
      documentVersionId: backendUuid(source, "documentVersionId", context),
      assignmentSource: backendEnum(
        source,
        "assignmentSource",
        OPERATIONAL_ASSIGNMENT_SOURCES,
        context,
      ),
      actionMode: backendEnum(
        source,
        "actionMode",
        OPERATIONAL_ACTION_MODES,
        context,
      ),
      status: backendEnum(
        source,
        "status",
        OPERATIONAL_ASSIGNMENT_STATUSES,
        context,
      ),
      assignedAt: backendTimestamp(source, "assignedAt", context),
      dueAt: backendNullableTimestamp(source, "dueAt", context),
      acknowledgedAt: backendNullableTimestamp(
        source,
        "acknowledgedAt",
        context,
      ),
      acceptedAt: backendNullableTimestamp(source, "acceptedAt", context),
      declinedAt: backendNullableTimestamp(source, "declinedAt", context),
      declineReason: backendNullableString(source, "declineReason", context),
      waivedAt: backendNullableTimestamp(source, "waivedAt", context),
      waiverReason: backendNullableString(source, "waiverReason", context),
      satisfiedByAssignmentId: backendNullableUuid(
        source,
        "satisfiedByAssignmentId",
        context,
      ),
      satisfiedByPreviousVersion: backendBoolean(
        source,
        "satisfiedByPreviousVersion",
        context,
      ),
      document: parseDocument(source.document, context),
      version: parseVersion(source.version, context),
      statements: backendArrayValue(source.statements, context).map(
        (statement) => parseStatement(statement, context),
      ),
      currentAction: source.currentAction === null
        ? null
        : parseCurrentAction(source.currentAction, context),
      inheritedFrom: source.inheritedFrom === null
        ? null
        : parseInheritedAssignment(source.inheritedFrom, context),
      isCurrentPublishedVersion: backendBoolean(
        source,
        "isCurrentPublishedVersion",
        context,
      ),
      canAct: backendBoolean(source, "canAct", context),
      downloadAvailable: backendBoolean(
        source,
        "downloadAvailable",
        context,
      ),
      createdAt: backendTimestamp(source, "createdAt", context),
      updatedAt: backendTimestamp(source, "updatedAt", context),
    };

    const assignment = toAssignmentVariant(shape, context);
    assertOperationalAssignmentInvariants(
      assignment,
      () => createBackendError(context),
    );
    return assignment;
  }

  function toAssignmentVariant(
    shape: AssignmentShape,
    context: Context,
  ): OperationalAssignment {
    if (
      shape.actionMode === "information_only" &&
      (
        shape.status === "available" ||
        shape.status === "waived" ||
        shape.status === "expired"
      )
    ) {
      return {
        ...shape,
        actionMode: shape.actionMode,
        status: shape.status,
      };
    }
    if (
      shape.actionMode === "acknowledgement_required" &&
      (
        shape.status === "pending" ||
        shape.status === "acknowledged" ||
        shape.status === "waived" ||
        shape.status === "expired"
      )
    ) {
      return {
        ...shape,
        actionMode: shape.actionMode,
        status: shape.status,
      };
    }
    if (
      shape.actionMode === "acceptance_required" &&
      (
        shape.status === "pending" ||
        shape.status === "accepted" ||
        shape.status === "declined" ||
        shape.status === "waived" ||
        shape.status === "expired"
      )
    ) {
      return {
        ...shape,
        actionMode: shape.actionMode,
        status: shape.status,
      };
    }
    throw createBackendError(context);
  }

  return { parseOperationalAssignment };
}
