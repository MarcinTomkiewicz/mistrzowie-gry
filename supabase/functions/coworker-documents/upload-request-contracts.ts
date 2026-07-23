import {
  coworkerDocumentReaders,
  type UnknownObject,
} from "./contract-context.ts";

export const SIGNATURE_DECLARATION_TYPES = [
  "unsigned",
  "handwritten",
  "trusted_profile",
  "qualified_electronic",
  "other_electronic",
  "unknown",
] as const;

export type SignatureDeclarationType =
  typeof SIGNATURE_DECLARATION_TYPES[number];

export interface UploadFilePayload {
  originalFilename: string;
  declaredMimeType: string;
  sizeBytes: number;
  signatureDeclarationType: SignatureDeclarationType;
}

const MIME_PATTERN =
  /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

const {
  requestEnum,
  requestInteger,
  requestString,
} = coworkerDocumentReaders;

export function parseUploadFilePayload(
  source: UnknownObject,
  path: string,
  errors: { [field: string]: string },
): UploadFilePayload {
  const originalFilenamePath = fieldPath(path, "originalFilename");
  const originalFilename = requestString(
    source,
    "originalFilename",
    originalFilenamePath,
    255,
    errors,
  );
  if (
    originalFilename !== "" &&
    (/[/\\]/.test(originalFilename) ||
      /[\u0000-\u001f\u007f]/.test(originalFilename))
  ) {
    errors[originalFilenamePath] =
      "Provide a file name without path separators.";
  }

  const declaredMimeTypePath = fieldPath(path, "declaredMimeType");
  const declaredMimeType = requestString(
    source,
    "declaredMimeType",
    declaredMimeTypePath,
    150,
    errors,
  ).toLowerCase();
  if (declaredMimeType !== "" && !MIME_PATTERN.test(declaredMimeType)) {
    errors[declaredMimeTypePath] = "Provide a valid MIME type.";
  }

  return {
    originalFilename,
    declaredMimeType,
    sizeBytes: requestInteger(
      source,
      "sizeBytes",
      fieldPath(path, "sizeBytes"),
      1,
      26_214_400,
      errors,
    ),
    signatureDeclarationType: requestEnum(
      source,
      "signatureDeclarationType",
      SIGNATURE_DECLARATION_TYPES,
      fieldPath(path, "signatureDeclarationType"),
      errors,
    ),
  };
}

function fieldPath(path: string, field: string): string {
  return path === "" ? field : `${path}.${field}`;
}
