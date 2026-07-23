import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

import { callRpc } from "../_shared/coworker-document-edge/rpc.ts";
import {
  COWORKER_SIGNING_PACKAGE_RPC,
  type ReserveSigningPackageItemUploadPayload,
} from "./signing-package-contracts.ts";

export function getSigningPackagePortal(
  client: SupabaseClient,
  userId: string,
): Promise<unknown> {
  return callRpc(client, COWORKER_SIGNING_PACKAGE_RPC.getPortal, {
    p_user_id: userId,
    p_actor_user_id: userId,
  });
}

export function getSigningPackageSourceDownloadTarget(
  client: SupabaseClient,
  userId: string,
  packageItemId: string,
): Promise<unknown> {
  return callRpc(
    client,
    COWORKER_SIGNING_PACKAGE_RPC.getSourceDownloadTarget,
    {
      p_user_id: userId,
      p_actor_user_id: userId,
      p_package_item_id: packageItemId,
    },
  );
}

export function reserveSigningPackageItemUpload(
  client: SupabaseClient,
  userId: string,
  packageItemId: string,
  payload: ReserveSigningPackageItemUploadPayload,
): Promise<unknown> {
  return callRpc(client, COWORKER_SIGNING_PACKAGE_RPC.reserveItemUpload, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_package_item_id: packageItemId,
    p_payload: payload,
  });
}

export function submitSigningPackageItem(
  client: SupabaseClient,
  userId: string,
  packageItemId: string,
): Promise<unknown> {
  return callRpc(client, COWORKER_SIGNING_PACKAGE_RPC.submitItem, {
    p_user_id: userId,
    p_actor_user_id: userId,
    p_package_item_id: packageItemId,
  });
}
