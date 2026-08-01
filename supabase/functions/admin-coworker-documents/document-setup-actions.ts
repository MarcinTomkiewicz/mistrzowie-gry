import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import { type AdminDocumentActionRequest, RPC } from "./contracts.ts";
import {
  parseOnboardingResult,
  parseRequirementResult,
  parseSavedDefinition,
  parseSeedRequirementsResult,
} from "./document-setup-response-contracts.ts";

export async function saveDefinition(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "saveDefinition" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.saveDefinition, {
    p_actor_user_id: actorUserId,
    p_payload: action.definition,
  });

  return Response.json({
    ok: true,
    action: "saveDefinition",
    definition: parseSavedDefinition(data),
  });
}

export async function ensureOnboarding(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "ensureOnboarding" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.ensureOnboarding, {
    p_user_id: action.userId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "ensureOnboarding",
    result: parseOnboardingResult(data, action.userId),
  });
}

export async function seedDefaultRequirements(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "seedDefaultRequirements" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.seedDefaultRequirements, {
    p_user_id: action.userId,
    p_onboarding_case_id: action.onboardingCaseId,
    p_actor_user_id: actorUserId,
  });

  return Response.json({
    ok: true,
    action: "seedDefaultRequirements",
    result: parseSeedRequirementsResult(
      data,
      action.userId,
      action.onboardingCaseId,
    ),
  });
}

export async function assignRequirement(
  client: SupabaseClient,
  actorUserId: string,
  action: Extract<
    AdminDocumentActionRequest,
    { action: "assignRequirement" }
  >,
): Promise<Response> {
  const data = await callRpc(client, RPC.assignRequirement, {
    p_actor_user_id: actorUserId,
    p_payload: action.requirement,
  });

  return Response.json({
    ok: true,
    action: "assignRequirement",
    requirement: parseRequirementResult(
      data,
      action.requirement.userId,
    ),
  });
}
