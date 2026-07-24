import { createContractReaders } from "./contract-readers.ts";
import {
  OPERATIONAL_ACTION_MODES,
  OPERATIONAL_DOCUMENT_STATUSES,
  OPERATIONAL_SHA256_BASE64_PATTERN,
  OPERATIONAL_VERSION_STATUSES,
  type OperationalFile,
  type OperationalVersionSummary,
} from "./operational-assignment-models.ts";

const DOCUMENT_KEYS = [
  "id",
  "code",
  "title",
  "description",
  "category",
  "status",
  "currentPublishedVersionId",
] as const;

const VERSION_KEYS = [
  "id",
  "versionNumber",
  "status",
  "title",
  "summary",
  "actionMode",
  "requiresReacceptance",
  "statementVersion",
  "actionDueAt",
  "publishedAt",
  "file",
] as const;

const FILE_KEYS = [
  "originalFilename",
  "declaredMimeType",
  "detectedMimeType",
  "sizeBytes",
  "contentSha256Base64",
] as const;

const DOCUMENT_CODE_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

export function createOperationalAssignmentMetadataParsers<Context>(
  readers: ContractReaders<Context>,
) {
  const {
    backendBoolean,
    backendEnum,
    backendNullablePatternString,
    backendNullablePositiveInteger,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendPatternString,
    backendPositiveInteger,
    backendString,
    backendUuid,
  } = readers;

  function parseDocument(value: unknown, context: Context) {
    const source = backendObject(value, context, DOCUMENT_KEYS);
    return {
      id: backendUuid(source, "id", context),
      code: backendPatternString(
        source,
        "code",
        DOCUMENT_CODE_PATTERN,
        context,
      ),
      title: backendString(source, "title", context),
      description: backendNullableString(source, "description", context),
      category: backendString(source, "category", context),
      status: backendEnum(
        source,
        "status",
        OPERATIONAL_DOCUMENT_STATUSES,
        context,
      ),
      currentPublishedVersionId: backendNullableUuid(
        source,
        "currentPublishedVersionId",
        context,
      ),
    };
  }

  function parseVersion(
    value: unknown,
    context: Context,
  ): OperationalVersionSummary {
    const source = backendObject(value, context, VERSION_KEYS);
    return {
      id: backendUuid(source, "id", context),
      versionNumber: backendPositiveInteger(
        source,
        "versionNumber",
        context,
      ),
      status: backendEnum(
        source,
        "status",
        OPERATIONAL_VERSION_STATUSES,
        context,
      ),
      title: backendString(source, "title", context),
      summary: backendNullableString(source, "summary", context),
      actionMode: backendEnum(
        source,
        "actionMode",
        OPERATIONAL_ACTION_MODES,
        context,
      ),
      requiresReacceptance: backendBoolean(
        source,
        "requiresReacceptance",
        context,
      ),
      statementVersion: backendPositiveInteger(
        source,
        "statementVersion",
        context,
      ),
      actionDueAt: backendNullableTimestamp(
        source,
        "actionDueAt",
        context,
      ),
      publishedAt: backendNullableTimestamp(source, "publishedAt", context),
      file: parseFile(source.file, context),
    };
  }

  function parseFile(value: unknown, context: Context): OperationalFile {
    const source = backendObject(value, context, FILE_KEYS);
    return {
      originalFilename: backendString(
        source,
        "originalFilename",
        context,
      ),
      declaredMimeType: backendString(source, "declaredMimeType", context),
      detectedMimeType: backendNullableString(
        source,
        "detectedMimeType",
        context,
      ),
      sizeBytes: backendNullablePositiveInteger(
        source,
        "sizeBytes",
        context,
      ),
      contentSha256Base64: backendNullablePatternString(
        source,
        "contentSha256Base64",
        OPERATIONAL_SHA256_BASE64_PATTERN,
        context,
      ),
    };
  }

  return {
    parseDocument,
    parseVersion,
  };
}
