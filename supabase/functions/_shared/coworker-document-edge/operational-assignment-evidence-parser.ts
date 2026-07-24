import { createContractReaders } from "./contract-readers.ts";
import {
  OPERATIONAL_ACTION_SOURCES,
  OPERATIONAL_ACTIONS,
  OPERATIONAL_ASSIGNMENT_STATUSES,
  OPERATIONAL_SHA256_BASE64_PATTERN,
  type OperationalCurrentAction,
  type OperationalInheritedAssignment,
  type OperationalStatement,
} from "./operational-assignment-models.ts";

const STATEMENT_KEYS = [
  "id",
  "action",
  "statementVersion",
  "text",
  "sha256Base64",
] as const;

const CURRENT_ACTION_KEYS = [
  "id",
  "action",
  "statementId",
  "statementVersion",
  "statementSha256Base64",
  "statementText",
  "declineReason",
  "source",
  "actorUserId",
  "actedAt",
] as const;

const INHERITED_KEYS = [
  "assignmentId",
  "documentVersionId",
  "versionNumber",
  "status",
  "acknowledgedAt",
  "acceptedAt",
] as const;

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

export function createOperationalAssignmentEvidenceParsers<Context>(
  readers: ContractReaders<Context>,
  createBackendError: (context: Context) => Error,
) {
  const {
    backendEnum,
    backendNullableString,
    backendNullableTimestamp,
    backendObject,
    backendPatternString,
    backendPositiveInteger,
    backendString,
    backendTimestamp,
    backendUuid,
  } = readers;

  function parseStatement(
    value: unknown,
    context: Context,
  ): OperationalStatement {
    const source = backendObject(value, context, STATEMENT_KEYS);
    return {
      id: backendUuid(source, "id", context),
      action: backendEnum(source, "action", OPERATIONAL_ACTIONS, context),
      statementVersion: backendPositiveInteger(
        source,
        "statementVersion",
        context,
      ),
      text: readStatementText(source, "text", context),
      sha256Base64: backendPatternString(
        source,
        "sha256Base64",
        OPERATIONAL_SHA256_BASE64_PATTERN,
        context,
      ),
    };
  }

  function parseCurrentAction(
    value: unknown,
    context: Context,
  ): OperationalCurrentAction {
    const source = backendObject(value, context, CURRENT_ACTION_KEYS);
    return {
      id: backendUuid(source, "id", context),
      action: backendEnum(source, "action", OPERATIONAL_ACTIONS, context),
      statementId: backendUuid(source, "statementId", context),
      statementVersion: backendPositiveInteger(
        source,
        "statementVersion",
        context,
      ),
      statementSha256Base64: backendPatternString(
        source,
        "statementSha256Base64",
        OPERATIONAL_SHA256_BASE64_PATTERN,
        context,
      ),
      statementText: readStatementText(source, "statementText", context),
      declineReason: backendNullableString(
        source,
        "declineReason",
        context,
      ),
      source: backendEnum(
        source,
        "source",
        OPERATIONAL_ACTION_SOURCES,
        context,
      ),
      actorUserId: backendUuid(source, "actorUserId", context),
      actedAt: backendTimestamp(source, "actedAt", context),
    };
  }

  function parseInheritedAssignment(
    value: unknown,
    context: Context,
  ): OperationalInheritedAssignment {
    const source = backendObject(value, context, INHERITED_KEYS);
    return {
      assignmentId: backendUuid(source, "assignmentId", context),
      documentVersionId: backendUuid(
        source,
        "documentVersionId",
        context,
      ),
      versionNumber: backendPositiveInteger(
        source,
        "versionNumber",
        context,
      ),
      status: backendEnum(
        source,
        "status",
        OPERATIONAL_ASSIGNMENT_STATUSES,
        context,
      ),
      acknowledgedAt: backendNullableTimestamp(
        source,
        "acknowledgedAt",
        context,
      ),
      acceptedAt: backendNullableTimestamp(source, "acceptedAt", context),
    };
  }

  function readStatementText(
    source: { [key: string]: unknown },
    key: string,
    context: Context,
  ): string {
    const text = backendString(source, key, context);
    if (text.trim() === "" || text.length > 8000) {
      throw createBackendError(context);
    }
    return text;
  }

  return {
    parseCurrentAction,
    parseInheritedAssignment,
    parseStatement,
  };
}
