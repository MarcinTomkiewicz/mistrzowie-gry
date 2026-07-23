import {
  isObject,
  isOneOf,
} from "../_shared/coworker-document-edge/contract-reader-foundation.ts";
import {
  SIGNING_PACKAGE_REVIEW_ACTIONS,
  type SigningPackageReviewActionRequest,
  signingPackageReviewReaders,
} from "./signing-package-review-contracts.ts";

const {
  assertOnlyKeys,
  requestEnum,
  requestNullableString,
  requestObject,
  requestString,
  requestUuid,
  validated,
} = signingPackageReviewReaders;

export function isSigningPackageReviewAction(value: unknown): boolean {
  return isObject(value) &&
    isOneOf(value.action, SIGNING_PACKAGE_REVIEW_ACTIONS);
}

export function parseSigningPackageReviewActionRequest(
  value: unknown,
): SigningPackageReviewActionRequest {
  const errors: { [field: string]: string } = {};
  const root = requestObject(value, "", errors);
  const action = requestEnum(
    root,
    "action",
    SIGNING_PACKAGE_REVIEW_ACTIONS,
    "action",
    errors,
  );

  switch (action) {
    case "startSigningPackageReview":
      assertOnlyKeys(root, ["action", "packageId"], "", errors);
      return validated({
        action,
        packageId: requestUuid(root, "packageId", "packageId", errors),
      }, errors);
    case "returnSigningPackageItemForCorrection":
      assertOnlyKeys(
        root,
        ["action", "packageItemId", "reason", "note"],
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
        reason: requestString(root, "reason", "reason", 2000, errors),
        note: requestNullableString(
          root,
          "note",
          "note",
          4000,
          errors,
          { required: true },
        ),
      }, errors);
    case "rejectSigningPackage":
      assertOnlyKeys(
        root,
        ["action", "packageId", "reason", "note"],
        "",
        errors,
      );
      return validated({
        action,
        packageId: requestUuid(root, "packageId", "packageId", errors),
        reason: requestString(root, "reason", "reason", 2000, errors),
        note: requestNullableString(
          root,
          "note",
          "note",
          4000,
          errors,
          { required: true },
        ),
      }, errors);
    case "acceptSigningPackage":
      assertOnlyKeys(
        root,
        ["action", "packageId", "note"],
        "",
        errors,
      );
      return validated({
        action,
        packageId: requestUuid(root, "packageId", "packageId", errors),
        note: requestNullableString(
          root,
          "note",
          "note",
          4000,
          errors,
          { required: true },
        ),
      }, errors);
    case "approveOnboarding":
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
  }
}
