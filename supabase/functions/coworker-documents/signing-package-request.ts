import {
  isObject,
  isOneOf,
} from "../_shared/coworker-document-edge/contract-reader-foundation.ts";
import { coworkerDocumentReaders } from "./contract-context.ts";
import {
  COWORKER_SIGNING_PACKAGE_ACTIONS,
  type CoworkerSigningPackageActionRequest,
  type ReserveSigningPackageItemUploadPayload,
} from "./signing-package-contracts.ts";
import { parseUploadFilePayload } from "./upload-request-contracts.ts";

const {
  assertOnlyKeys,
  requestEnum,
  requestObject,
  requestUuid,
  validated,
} = coworkerDocumentReaders;

export function isCoworkerSigningPackageAction(value: unknown): boolean {
  return isObject(value) &&
    isOneOf(value.action, COWORKER_SIGNING_PACKAGE_ACTIONS);
}

export function parseCoworkerSigningPackageActionRequest(
  value: unknown,
): CoworkerSigningPackageActionRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(
    root,
    "action",
    COWORKER_SIGNING_PACKAGE_ACTIONS,
    "action",
    errors,
  );

  switch (action) {
    case "getSigningPackagePortal":
      assertOnlyKeys(root, ["action"], "", errors);
      return validated({ action }, errors);
    case "downloadSigningPackageSource":
    case "submitSigningPackageItem":
      assertOnlyKeys(root, ["action", "packageItemId"], "", errors);
      return validated({
        action,
        packageItemId: requestUuid(
          root,
          "packageItemId",
          "packageItemId",
          errors,
        ),
      }, errors);
    case "recoverUpload":
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
    case "reserveSigningPackageItemUpload":
      assertOnlyKeys(
        root,
        ["action", "packageItemId", "upload"],
        "",
        errors,
      );
      return validated({
        action,
        packageItemId: requestUuid(
          root,
          "packageItemId",
          "packageItemId",
          errors,
        ),
        upload: parsePackageItemUpload(root.upload, errors),
      }, errors);
  }
}

function parsePackageItemUpload(
  value: unknown,
  errors: { [field: string]: string },
): ReserveSigningPackageItemUploadPayload {
  const upload = requestObject(value, "upload", errors);
  assertOnlyKeys(upload, [
    "originalFilename",
    "declaredMimeType",
    "sizeBytes",
    "signatureDeclarationType",
  ], "upload", errors);
  const parsed = parseUploadFilePayload(upload, "upload", errors);

  if (parsed.signatureDeclarationType === "unsigned") {
    errors["upload.signatureDeclarationType"] =
      "Package item uploads require a signature declaration.";
  }
  return parsed;
}
