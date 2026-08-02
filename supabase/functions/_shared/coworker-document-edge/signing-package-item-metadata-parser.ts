import { createContractReaders } from "./contract-readers.ts";
import { createCoworkerDocumentDefinitionParser } from "./coworker-document-definition-parser.ts";
import { COWORKER_DOCUMENT_REQUIREMENT_STATUSES } from "./coworker-document-models.ts";
import {
  SIGNING_PACKAGE_SHA256_BASE64_PATTERN,
  SIGNING_PACKAGE_SOURCE_SCOPES,
  SIGNING_PACKAGE_SOURCE_STATUSES,
  type SigningPackageRequirement,
  type SigningPackageSource,
  type SigningPackageSourceFile,
} from "./signing-package-models.ts";

const REQUIREMENT_KEYS = [
  "id",
  "onboardingCaseId",
  "status",
  "required",
  "dueAt",
  "fulfilledByDocumentId",
  "fulfilledAt",
  "waivedAt",
  "waiverReason",
] as const;

const SOURCE_KEYS = [
  "sourceId",
  "sourceVersionId",
  "versionNumber",
  "sourceScope",
  "status",
  "sha256Base64",
  "file",
  "downloadAvailable",
] as const;

const SOURCE_FILE_KEYS = [
  "originalFilename",
  "mimeType",
  "sizeBytes",
] as const;

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

export function createSigningPackageItemMetadataParsers<Context>(
  readers: ContractReaders<Context>,
) {
  const {
    backendBoolean,
    backendEnum,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendPatternString,
    backendPositiveInteger,
    backendString,
    backendUuid,
  } = readers;
  const { parseCoworkerDocumentDefinition: parseDocumentDefinition } =
    createCoworkerDocumentDefinitionParser(readers);

  function parseRequirement(
    value: unknown,
    context: Context,
  ): SigningPackageRequirement {
    const result = backendObject(value, context, REQUIREMENT_KEYS);
    return {
      id: backendUuid(result, "id", context),
      onboardingCaseId: backendNullableUuid(
        result,
        "onboardingCaseId",
        context,
      ),
      status: backendEnum(
        result,
        "status",
        COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
        context,
      ),
      required: backendBoolean(result, "required", context),
      dueAt: backendNullableTimestamp(result, "dueAt", context),
      fulfilledByDocumentId: backendNullableUuid(
        result,
        "fulfilledByDocumentId",
        context,
      ),
      fulfilledAt: backendNullableTimestamp(result, "fulfilledAt", context),
      waivedAt: backendNullableTimestamp(result, "waivedAt", context),
      waiverReason: backendNullableString(result, "waiverReason", context),
    };
  }

  function parseSource(
    value: unknown,
    context: Context,
  ): SigningPackageSource {
    const result = backendObject(value, context, SOURCE_KEYS);
    return {
      sourceId: backendUuid(result, "sourceId", context),
      sourceVersionId: backendUuid(result, "sourceVersionId", context),
      versionNumber: backendPositiveInteger(result, "versionNumber", context),
      sourceScope: backendEnum(
        result,
        "sourceScope",
        SIGNING_PACKAGE_SOURCE_SCOPES,
        context,
      ),
      status: backendEnum(
        result,
        "status",
        SIGNING_PACKAGE_SOURCE_STATUSES,
        context,
      ),
      sha256Base64: backendPatternString(
        result,
        "sha256Base64",
        SIGNING_PACKAGE_SHA256_BASE64_PATTERN,
        context,
      ),
      file: parseSourceFile(result.file, context),
      downloadAvailable: backendBoolean(
        result,
        "downloadAvailable",
        context,
      ),
    };
  }

  function parseSourceFile(
    value: unknown,
    context: Context,
  ): SigningPackageSourceFile {
    const result = backendObject(value, context, SOURCE_FILE_KEYS);
    return {
      originalFilename: backendString(result, "originalFilename", context),
      mimeType: backendString(result, "mimeType", context),
      sizeBytes: backendPositiveInteger(result, "sizeBytes", context),
    };
  }

  return { parseDocumentDefinition, parseRequirement, parseSource };
}
