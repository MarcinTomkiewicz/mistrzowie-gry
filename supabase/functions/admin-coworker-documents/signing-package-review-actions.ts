import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import type { SigningPackage } from "../_shared/coworker-document-edge/signing-package-models.ts";
import {
  SIGNING_PACKAGE_REVIEW_RPC,
  type SigningPackageReviewActionRequest,
} from "./signing-package-review-contracts.ts";
import {
  parseApproveOnboardingResult,
  parseSigningPackageReviewResult,
} from "./signing-package-review-response-contracts.ts";
import {
  acceptSigningPackage,
  approveOnboarding,
  rejectSigningPackage,
  returnSigningPackageItemForCorrection,
  startSigningPackageReview,
} from "./signing-package-review-rpc.ts";

export async function handleSigningPackageReviewAction(
  client: SupabaseClient,
  actorUserId: string,
  action: SigningPackageReviewActionRequest,
): Promise<Response> {
  switch (action.action) {
    case "startSigningPackageReview": {
      const data = await startSigningPackageReview(
        client,
        actorUserId,
        action.packageId,
      );
      return detailResponse(
        action.action,
        parseSigningPackageReviewResult(
          data,
          SIGNING_PACKAGE_REVIEW_RPC.startReview,
          {
            packageId: action.packageId,
            status: "under_review",
          },
        ),
      );
    }
    case "returnSigningPackageItemForCorrection": {
      const data = await returnSigningPackageItemForCorrection(
        client,
        actorUserId,
        action.packageItemId,
        action.reason,
        action.note,
      );
      return detailResponse(
        action.action,
        parseSigningPackageReviewResult(
          data,
          SIGNING_PACKAGE_REVIEW_RPC.returnItemForCorrection,
          {
            packageItemId: action.packageItemId,
            status: "needs_correction",
            itemStatus: "needs_correction",
          },
        ),
      );
    }
    case "rejectSigningPackage": {
      const data = await rejectSigningPackage(
        client,
        actorUserId,
        action.packageId,
        action.reason,
        action.note,
      );
      return detailResponse(
        action.action,
        parseSigningPackageReviewResult(
          data,
          SIGNING_PACKAGE_REVIEW_RPC.rejectPackage,
          {
            packageId: action.packageId,
            status: "rejected",
          },
        ),
      );
    }
    case "acceptSigningPackage": {
      const data = await acceptSigningPackage(
        client,
        actorUserId,
        action.packageId,
        action.note,
      );
      return detailResponse(
        action.action,
        parseSigningPackageReviewResult(
          data,
          SIGNING_PACKAGE_REVIEW_RPC.acceptPackage,
          {
            packageId: action.packageId,
            status: "approved",
          },
        ),
      );
    }
    case "approveOnboarding": {
      const data = await approveOnboarding(
        client,
        actorUserId,
        action.userId,
        action.onboardingCaseId,
      );
      return Response.json({
        ok: true,
        action: "approveOnboarding",
        result: parseApproveOnboardingResult(
          data,
          action.userId,
          action.onboardingCaseId,
        ),
      });
    }
  }
}

function detailResponse(
  action:
    | "startSigningPackageReview"
    | "returnSigningPackageItemForCorrection"
    | "rejectSigningPackage"
    | "acceptSigningPackage",
  detail: SigningPackage,
): Response {
  return Response.json({ ok: true, action, detail });
}
