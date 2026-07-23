import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { SIGNING_PACKAGE_REVIEW_RPC } from "./signing-package-review-contracts.ts";

export function startSigningPackageReview(
  client: SupabaseClient,
  actorUserId: string,
  packageId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_REVIEW_RPC.startReview, {
    p_package_id: packageId,
    p_actor_user_id: actorUserId,
  });
}

export function returnSigningPackageItemForCorrection(
  client: SupabaseClient,
  actorUserId: string,
  packageItemId: string,
  reason: string,
  note: string | null,
): Promise<unknown> {
  return callRpc(
    client,
    SIGNING_PACKAGE_REVIEW_RPC.returnItemForCorrection,
    {
      p_package_item_id: packageItemId,
      p_actor_user_id: actorUserId,
      p_reason: reason,
      p_note: note,
    },
  );
}

export function rejectSigningPackage(
  client: SupabaseClient,
  actorUserId: string,
  packageId: string,
  reason: string,
  note: string | null,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_REVIEW_RPC.rejectPackage, {
    p_package_id: packageId,
    p_actor_user_id: actorUserId,
    p_reason: reason,
    p_note: note,
  });
}

export function acceptSigningPackage(
  client: SupabaseClient,
  actorUserId: string,
  packageId: string,
  note: string | null,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_REVIEW_RPC.acceptPackage, {
    p_package_id: packageId,
    p_actor_user_id: actorUserId,
    p_note: note,
  });
}

export function approveOnboarding(
  client: SupabaseClient,
  actorUserId: string,
  userId: string,
  onboardingCaseId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_REVIEW_RPC.approveOnboarding, {
    p_user_id: userId,
    p_onboarding_case_id: onboardingCaseId,
    p_actor_user_id: actorUserId,
  });
}
