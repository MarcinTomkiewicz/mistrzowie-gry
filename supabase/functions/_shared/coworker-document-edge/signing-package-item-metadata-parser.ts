import {
  COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES,
} from "./coworker-document-models.ts";
import { createContractReaders } from "./contract-readers.ts";
import {
  SIGNING_PACKAGE_AUTOMATIC_VERIFICATION_MODES,
  SIGNING_PACKAGE_MULTIPLICITIES,
  SIGNING_PACKAGE_ORIGIN_POLICIES,
  SIGNING_PACKAGE_REQUIREMENT_STATUSES,
  SIGNING_PACKAGE_SHA256_BASE64_PATTERN,
  SIGNING_PACKAGE_SOURCE_SCOPES,
  SIGNING_PACKAGE_SOURCE_STATUSES,
  type SigningPackageDocumentDefinition,
  type SigningPackageRequirement,
  type SigningPackageSignaturePolicy,
  type SigningPackageSource,
  type SigningPackageSourceFile,
} from "./signing-package-models.ts";

const DOCUMENT_DEFINITION_KEYS = [
  "id",
  "code",
  "title",
  "description",
  "category",
  "originPolicy",
  "multiplicity",
  "isRequiredByDefault",
  "allowedMimeTypes",
  "allowedExtensions",
  "maxSizeBytes",
  "retentionDays",
  "isActive",
  "activeFrom",
  "activeUntil",
  "signaturePolicy",
  "createdAt",
  "updatedAt",
] as const;

const SIGNATURE_POLICY_KEYS = [
  "id",
  "code",
  "name",
  "description",
  "signatureRequired",
  "allowedDeclarationTypes",
  "manualReviewRequired",
  "automaticVerificationMode",
  "isActive",
] as const;

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
    backendArray,
    backendBoolean,
    backendEnum,
    backendNonNegativeInteger,
    backendNullableString,
    backendNullableTimestamp,
    backendNullableUuid,
    backendObject,
    backendPatternString,
    backendPositiveInteger,
    backendString,
    backendTimestamp,
    backendUuid,
  } = readers;

  function parseDocumentDefinition(
    value: unknown,
    context: Context,
  ): SigningPackageDocumentDefinition {
    const result = backendObject(value, context, DOCUMENT_DEFINITION_KEYS);
    return {
      id: backendUuid(result, "id", context),
      code: backendString(result, "code", context),
      title: backendString(result, "title", context),
      description: backendNullableString(result, "description", context),
      category: backendString(result, "category", context),
      originPolicy: backendEnum(
        result,
        "originPolicy",
        SIGNING_PACKAGE_ORIGIN_POLICIES,
        context,
      ),
      multiplicity: backendEnum(
        result,
        "multiplicity",
        SIGNING_PACKAGE_MULTIPLICITIES,
        context,
      ),
      isRequiredByDefault: backendBoolean(
        result,
        "isRequiredByDefault",
        context,
      ),
      allowedMimeTypes: parseStringArray(
        result,
        "allowedMimeTypes",
        context,
      ),
      allowedExtensions: parseStringArray(
        result,
        "allowedExtensions",
        context,
      ),
      maxSizeBytes: backendPositiveInteger(result, "maxSizeBytes", context),
      retentionDays: result.retentionDays === null
        ? null
        : backendNonNegativeInteger(result, "retentionDays", context),
      isActive: backendBoolean(result, "isActive", context),
      activeFrom: backendNullableTimestamp(result, "activeFrom", context),
      activeUntil: backendNullableTimestamp(result, "activeUntil", context),
      signaturePolicy: parseSignaturePolicy(result.signaturePolicy, context),
      createdAt: backendTimestamp(result, "createdAt", context),
      updatedAt: backendTimestamp(result, "updatedAt", context),
    };
  }

  function parseSignaturePolicy(
    value: unknown,
    context: Context,
  ): SigningPackageSignaturePolicy {
    const result = backendObject(value, context, SIGNATURE_POLICY_KEYS);
    return {
      id: backendUuid(result, "id", context),
      code: backendString(result, "code", context),
      name: backendString(result, "name", context),
      description: backendNullableString(result, "description", context),
      signatureRequired: backendBoolean(
        result,
        "signatureRequired",
        context,
      ),
      allowedDeclarationTypes: backendArray(
        result,
        "allowedDeclarationTypes",
        context,
      ).map((item) =>
        backendEnum(
          { item },
          "item",
          COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES,
          context,
        )
      ),
      manualReviewRequired: backendBoolean(
        result,
        "manualReviewRequired",
        context,
      ),
      automaticVerificationMode: backendEnum(
        result,
        "automaticVerificationMode",
        SIGNING_PACKAGE_AUTOMATIC_VERIFICATION_MODES,
        context,
      ),
      isActive: backendBoolean(result, "isActive", context),
    };
  }

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
        SIGNING_PACKAGE_REQUIREMENT_STATUSES,
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

  function parseStringArray(
    source: { [key: string]: unknown },
    key: string,
    context: Context,
  ): string[] {
    return backendArray(source, key, context).map((item) =>
      backendString({ item }, "item", context)
    );
  }

  return { parseDocumentDefinition, parseRequirement, parseSource };
}
