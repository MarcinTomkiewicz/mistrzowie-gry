import {
  type CoworkerDocumentActionRequest,
  type ReserveUploadAction,
} from "./contracts.ts";
import {
  coworkerDocumentReaders,
  RequestValidationError,
  type UnknownObject,
} from "./contract-context.ts";
import { parseUploadFilePayload } from "./upload-request-contracts.ts";

const ACTIONS = [
  "reserveUpload",
  "finalizeUpload",
  "cancelUpload",
  "submitDocument",
  "withdrawDocument",
  "downloadDocumentVersion",
  "markNotificationRead",
] as const;

const {
  assertOnlyKeys,
  requestEnum,
  requestNullableString,
  requestNullableUuid,
  requestObject,
  requestUuid,
  throwIfRequestInvalid,
  validated,
} = coworkerDocumentReaders;

export function parseDocumentActionRequest(
  value: unknown,
): CoworkerDocumentActionRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(root, "action", ACTIONS, "action", errors);

  switch (action) {
    case "reserveUpload":
      return parseReserveUpload(root, errors);
    case "finalizeUpload":
    case "cancelUpload":
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
    case "submitDocument":
    case "withdrawDocument":
      assertOnlyKeys(root, ["action", "documentId"], "", errors);
      return validated({
        action,
        documentId: requestUuid(
          root,
          "documentId",
          "documentId",
          errors,
        ),
      }, errors);
    case "downloadDocumentVersion":
      assertOnlyKeys(root, ["action", "documentVersionId"], "", errors);
      return validated({
        action,
        documentVersionId: requestUuid(
          root,
          "documentVersionId",
          "documentVersionId",
          errors,
        ),
      }, errors);
    case "markNotificationRead":
      assertOnlyKeys(root, ["action", "notificationId"], "", errors);
      return validated({
        action,
        notificationId: requestUuid(
          root,
          "notificationId",
          "notificationId",
          errors,
        ),
      }, errors);
    default:
      throwIfRequestInvalid(errors);
      throw new RequestValidationError({
        action: "Unsupported document action.",
      });
  }
}

function parseReserveUpload(
  root: UnknownObject,
  errors: { [field: string]: string },
): ReserveUploadAction {
  assertOnlyKeys(
    root,
    [
      "action",
      "documentId",
      "requirementId",
      "documentDefinitionId",
      "onboardingCaseId",
      "originalFilename",
      "declaredMimeType",
      "sizeBytes",
      "signatureDeclarationType",
      "title",
    ],
    "",
    errors,
  );

  const documentId = requestNullableUuid(
    root,
    "documentId",
    "documentId",
    errors,
  );
  const requirementId = requestNullableUuid(
    root,
    "requirementId",
    "requirementId",
    errors,
  );
  const documentDefinitionId = requestNullableUuid(
    root,
    "documentDefinitionId",
    "documentDefinitionId",
    errors,
  );
  const onboardingCaseId = requestNullableUuid(
    root,
    "onboardingCaseId",
    "onboardingCaseId",
    errors,
  );

  if (
    documentId === null &&
    requirementId === null &&
    documentDefinitionId === null
  ) {
    errors.documentDefinitionId =
      "Provide documentId, requirementId or documentDefinitionId.";
  }

  const upload = parseUploadFilePayload(root, "", errors);
  const title = requestNullableString(
    root,
    "title",
    "title",
    250,
    errors,
  );
  throwIfRequestInvalid(errors);

  return {
    action: "reserveUpload",
    documentId,
    requirementId,
    documentDefinitionId,
    onboardingCaseId,
    ...upload,
    title,
  };
}
