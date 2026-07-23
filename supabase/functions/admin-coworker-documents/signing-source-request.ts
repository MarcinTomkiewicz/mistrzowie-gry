import {
  GLOBAL_SIGNING_SOURCE_CODES,
  type ReserveSigningSourceUploadPayload,
  SIGNING_SOURCE_ACTIONS,
  SIGNING_SOURCE_CODES,
  SIGNING_SOURCE_TYPES,
  type SigningSourceActionRequest,
  signingSourceReaders,
} from "./signing-source-contracts.ts";

const MIME_PATTERN = /^[a-z0-9][a-z0-9.+-]*\/[a-z0-9][a-z0-9.+-]*$/;

const {
  assertOnlyKeys,
  requestEnum,
  requestInteger,
  requestNullableUuid,
  requestObject,
  requestString,
  requestUuid,
  validated,
} = signingSourceReaders;

export function isSigningSourceAction(value: unknown): boolean {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }
  const action = Reflect.get(value, "action");
  return typeof action === "string" &&
    SIGNING_SOURCE_ACTIONS.some((candidate) => candidate === action);
}

export function parseSigningSourceActionRequest(
  value: unknown,
): SigningSourceActionRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(
    root,
    "action",
    SIGNING_SOURCE_ACTIONS,
    "action",
    errors,
  );

  switch (action) {
    case "getSigningSourceCatalog":
      assertOnlyKeys(root, ["action"], "", errors);
      return validated({ action }, errors);
    case "getSigningSourceDetail":
      assertOnlyKeys(root, ["action", "sourceId"], "", errors);
      return validated({
        action,
        sourceId: requestUuid(root, "sourceId", "sourceId", errors),
      }, errors);
    case "reserveSigningSourceUpload":
      assertOnlyKeys(root, ["action", "upload"], "", errors);
      return validated({
        action,
        upload: parseReserveUpload(root.upload, errors),
      }, errors);
    case "recoverSigningSourceUpload":
    case "finalizeSigningSourceUpload":
    case "cancelSigningSourceUpload":
      assertOnlyKeys(root, ["action", "uploadSessionId"], "", errors);
      return validated({
        action,
        uploadSessionId: requestUuid(
          root,
          "uploadSessionId",
          "uploadSessionId",
          errors,
        ),
      }, errors);
    case "publishSigningSourceVersion":
    case "downloadSigningSourceVersion":
      assertOnlyKeys(root, ["action", "sourceVersionId"], "", errors);
      return validated({
        action,
        sourceVersionId: requestUuid(
          root,
          "sourceVersionId",
          "sourceVersionId",
          errors,
        ),
      }, errors);
  }
}

function parseReserveUpload(
  value: unknown,
  errors: { [field: string]: string },
): ReserveSigningSourceUploadPayload {
  const upload = requestObject(value, "upload", errors);
  assertOnlyKeys(
    upload,
    [
      "sourceId",
      "sourceType",
      "sourceCode",
      "onboardingCaseId",
      "originalFilename",
      "declaredMimeType",
      "sizeBytes",
    ],
    "upload",
    errors,
  );

  const sourceType = requestEnum(
    upload,
    "sourceType",
    SIGNING_SOURCE_TYPES,
    "upload.sourceType",
    errors,
  );
  const sourceCode = requestEnum(
    upload,
    "sourceCode",
    SIGNING_SOURCE_CODES,
    "upload.sourceCode",
    errors,
  );
  const onboardingCaseId = requestNullableUuid(
    upload,
    "onboardingCaseId",
    "upload.onboardingCaseId",
    errors,
    { required: true, allowEmptyString: false },
  );
  const originalFilename = requestString(
    upload,
    "originalFilename",
    "upload.originalFilename",
    255,
    errors,
  );
  const declaredMimeType = requestString(
    upload,
    "declaredMimeType",
    "upload.declaredMimeType",
    150,
    errors,
  );

  if (hasInvalidFilenameCharacters(originalFilename)) {
    errors["upload.originalFilename"] =
      "Filename cannot contain path separators or control characters.";
  }
  if (
    declaredMimeType !== declaredMimeType.toLowerCase() ||
    !MIME_PATTERN.test(declaredMimeType)
  ) {
    errors["upload.declaredMimeType"] = "Expected a valid lowercase MIME type.";
  }
  if (sourceType === "global_template") {
    if (onboardingCaseId !== null) {
      errors["upload.onboardingCaseId"] =
        "Global templates cannot belong to an onboarding case.";
    }
    if (
      !GLOBAL_SIGNING_SOURCE_CODES.some(
        (globalSourceCode) => globalSourceCode === sourceCode,
      )
    ) {
      errors["upload.sourceCode"] = "Expected a global signing source code.";
    }
  } else {
    if (onboardingCaseId === null) {
      errors["upload.onboardingCaseId"] = "An onboarding case is required.";
    }
    if (sourceCode !== "mandate_contract") {
      errors["upload.sourceCode"] =
        "Onboarding-case sources must use mandate_contract.";
    }
  }

  return {
    sourceId: requestNullableUuid(
      upload,
      "sourceId",
      "upload.sourceId",
      errors,
      { required: true, allowEmptyString: false },
    ),
    sourceType,
    sourceCode,
    onboardingCaseId,
    originalFilename,
    declaredMimeType,
    sizeBytes: requestInteger(
      upload,
      "sizeBytes",
      "upload.sizeBytes",
      1,
      26_214_400,
      errors,
    ),
  };
}

function hasInvalidFilenameCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.charCodeAt(0);
    return character === "/" ||
      character === "\\" ||
      codePoint < 32 ||
      codePoint === 127;
  });
}
