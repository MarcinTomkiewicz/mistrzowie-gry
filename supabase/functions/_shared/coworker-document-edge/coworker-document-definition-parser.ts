import { createContractReaders } from "./contract-readers.ts";
import {
  COWORKER_DOCUMENT_AUTOMATIC_VERIFICATION_MODES,
  COWORKER_DOCUMENT_MULTIPLICITIES,
  COWORKER_DOCUMENT_ORIGIN_POLICIES,
  COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES,
  type CoworkerDocumentDefinition,
  type CoworkerSignaturePolicy,
} from "./coworker-document-models.ts";

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

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

export function createCoworkerDocumentDefinitionParser<Context>(
  readers: ContractReaders<Context>,
) {
  const {
    backendArray,
    backendBoolean,
    backendEnum,
    backendNonNegativeInteger,
    backendNullableString,
    backendNullableTimestamp,
    backendObject,
    backendPositiveInteger,
    backendString,
    backendTimestamp,
    backendUuid,
  } = readers;

  function parseCoworkerDocumentDefinition(
    value: unknown,
    context: Context,
  ): CoworkerDocumentDefinition {
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
        COWORKER_DOCUMENT_ORIGIN_POLICIES,
        context,
      ),
      multiplicity: backendEnum(
        result,
        "multiplicity",
        COWORKER_DOCUMENT_MULTIPLICITIES,
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
  ): CoworkerSignaturePolicy {
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
        COWORKER_DOCUMENT_AUTOMATIC_VERIFICATION_MODES,
        context,
      ),
      isActive: backendBoolean(result, "isActive", context),
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

  return { parseCoworkerDocumentDefinition };
}
