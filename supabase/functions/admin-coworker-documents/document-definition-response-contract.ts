import { COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES } from "../_shared/coworker-document-edge/coworker-document-parser.ts";
import type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";
import { adminDocumentReaders, RPC } from "./contracts.ts";

const ORIGIN_POLICIES = [
  "coworker_upload",
  "admin_upload",
  "system_generated",
  "mixed",
] as const;

const MULTIPLICITIES = ["single", "multiple", "versioned_single"] as const;

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
} = adminDocumentReaders;

export function parseReviewDocumentDefinition(value: unknown) {
  const source = backendObject(value, RPC.getReviewDetail, [
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
  ]);
  const retentionDays = source.retentionDays === null
    ? null
    : backendNonNegativeInteger(source, "retentionDays", RPC.getReviewDetail);
  return {
    id: backendUuid(source, "id", RPC.getReviewDetail),
    code: backendString(source, "code", RPC.getReviewDetail),
    title: backendString(source, "title", RPC.getReviewDetail),
    description: backendNullableString(
      source,
      "description",
      RPC.getReviewDetail,
    ),
    category: backendString(source, "category", RPC.getReviewDetail),
    originPolicy: backendEnum(
      source,
      "originPolicy",
      ORIGIN_POLICIES,
      RPC.getReviewDetail,
    ),
    multiplicity: backendEnum(
      source,
      "multiplicity",
      MULTIPLICITIES,
      RPC.getReviewDetail,
    ),
    isRequiredByDefault: backendBoolean(
      source,
      "isRequiredByDefault",
      RPC.getReviewDetail,
    ),
    allowedMimeTypes: parseStringArray(source, "allowedMimeTypes"),
    allowedExtensions: parseStringArray(source, "allowedExtensions"),
    maxSizeBytes: backendPositiveInteger(
      source,
      "maxSizeBytes",
      RPC.getReviewDetail,
    ),
    retentionDays,
    isActive: backendBoolean(source, "isActive", RPC.getReviewDetail),
    activeFrom: backendNullableTimestamp(
      source,
      "activeFrom",
      RPC.getReviewDetail,
    ),
    activeUntil: backendNullableTimestamp(
      source,
      "activeUntil",
      RPC.getReviewDetail,
    ),
    signaturePolicy: parseSignaturePolicy(source.signaturePolicy),
    createdAt: backendTimestamp(source, "createdAt", RPC.getReviewDetail),
    updatedAt: backendTimestamp(source, "updatedAt", RPC.getReviewDetail),
  };
}

function parseSignaturePolicy(value: unknown) {
  const source = backendObject(value, RPC.getReviewDetail, [
    "id",
    "code",
    "name",
    "description",
    "signatureRequired",
    "allowedDeclarationTypes",
    "manualReviewRequired",
    "automaticVerificationMode",
    "isActive",
  ]);
  return {
    id: backendUuid(source, "id", RPC.getReviewDetail),
    code: backendString(source, "code", RPC.getReviewDetail),
    name: backendString(source, "name", RPC.getReviewDetail),
    description: backendNullableString(
      source,
      "description",
      RPC.getReviewDetail,
    ),
    signatureRequired: backendBoolean(
      source,
      "signatureRequired",
      RPC.getReviewDetail,
    ),
    allowedDeclarationTypes: backendArray(
      source,
      "allowedDeclarationTypes",
      RPC.getReviewDetail,
    ).map((item) =>
      backendEnum(
        { item },
        "item",
        COWORKER_DOCUMENT_SIGNATURE_DECLARATION_TYPES,
        RPC.getReviewDetail,
      )
    ),
    manualReviewRequired: backendBoolean(
      source,
      "manualReviewRequired",
      RPC.getReviewDetail,
    ),
    automaticVerificationMode: backendString(
      source,
      "automaticVerificationMode",
      RPC.getReviewDetail,
    ),
    isActive: backendBoolean(source, "isActive", RPC.getReviewDetail),
  };
}

function parseStringArray(source: UnknownObject, key: string): string[] {
  return backendArray(source, key, RPC.getReviewDetail).map((item) =>
    backendString({ item }, "item", RPC.getReviewDetail)
  );
}
