import {
  isObject,
  isOneOf,
} from "../_shared/coworker-document-edge/contract-reader-foundation.ts";
import {
  SIGNING_PACKAGE_ACTIONS,
  type SigningPackageActionRequest,
  signingPackageReaders,
} from "./signing-package-contracts.ts";

const {
  assertOnlyKeys,
  requestEnum,
  requestNullableString,
  requestObject,
  requestUuid,
  validated,
} = signingPackageReaders;

export function isSigningPackageAction(value: unknown): boolean {
  return isObject(value) &&
    isOneOf(value.action, SIGNING_PACKAGE_ACTIONS);
}

export function parseSigningPackageActionRequest(
  value: unknown,
): SigningPackageActionRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(
    root,
    "action",
    SIGNING_PACKAGE_ACTIONS,
    "action",
    errors,
  );

  switch (action) {
    case "recordQuestionnaireDelivery":
      assertOnlyKeys(root, [
        "action",
        "userId",
        "onboardingCaseId",
        "documentId",
        "documentVersionId",
        "note",
      ], "", errors);
      return validated({
        action,
        userId: requestUuid(root, "userId", "userId", errors),
        onboardingCaseId: requestUuid(
          root,
          "onboardingCaseId",
          "onboardingCaseId",
          errors,
        ),
        documentId: requestUuid(root, "documentId", "documentId", errors),
        documentVersionId: requestUuid(
          root,
          "documentVersionId",
          "documentVersionId",
          errors,
        ),
        note: requestNullableString(
          root,
          "note",
          "note",
          4000,
          errors,
          { required: true },
        ),
      }, errors);
    case "issueSigningPackage":
      assertOnlyKeys(
        root,
        ["action", "userId", "onboardingCaseId"],
        "",
        errors,
      );
      return validated({
        action,
        userId: requestUuid(root, "userId", "userId", errors),
        onboardingCaseId: requestUuid(
          root,
          "onboardingCaseId",
          "onboardingCaseId",
          errors,
        ),
      }, errors);
    case "getSigningPackageList":
      assertOnlyKeys(root, ["action"], "", errors);
      return validated({ action }, errors);
    case "getSigningPackageDetail":
      assertOnlyKeys(root, ["action", "packageId"], "", errors);
      return validated({
        action,
        packageId: requestUuid(root, "packageId", "packageId", errors),
      }, errors);
  }
}
