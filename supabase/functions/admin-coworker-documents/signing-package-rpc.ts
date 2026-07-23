import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { SIGNING_PACKAGE_RPC } from "./signing-package-contracts.ts";

export function recordQuestionnaireDelivery(
  client: SupabaseClient,
  actorUserId: string,
  userId: string,
  onboardingCaseId: string,
  documentId: string,
  documentVersionId: string,
  note: string | null,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_RPC.recordQuestionnaireDelivery, {
    p_user_id: userId,
    p_onboarding_case_id: onboardingCaseId,
    p_document_id: documentId,
    p_document_version_id: documentVersionId,
    p_actor_user_id: actorUserId,
    p_destination: "accounting",
    p_delivery_type: "onboarding_questionnaire",
    p_note: note,
  });
}

export function issueSigningPackage(
  client: SupabaseClient,
  actorUserId: string,
  userId: string,
  onboardingCaseId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_RPC.issuePackage, {
    p_user_id: userId,
    p_onboarding_case_id: onboardingCaseId,
    p_actor_user_id: actorUserId,
  });
}

export function getSigningPackageList(
  client: SupabaseClient,
  actorUserId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_RPC.getPackageList, {
    p_actor_user_id: actorUserId,
  });
}

export function getSigningPackageDetail(
  client: SupabaseClient,
  actorUserId: string,
  packageId: string,
): Promise<unknown> {
  return callRpc(client, SIGNING_PACKAGE_RPC.getPackageDetail, {
    p_package_id: packageId,
    p_actor_user_id: actorUserId,
  });
}
