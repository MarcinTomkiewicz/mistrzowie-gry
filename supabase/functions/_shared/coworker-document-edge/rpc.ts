import type { SupabaseClient } from "npm:@supabase/supabase-js@^2";

export class RpcCallError<RpcName extends string = string> extends Error {
  constructor(
    readonly rpcName: RpcName,
    readonly sqlState: string | null,
  ) {
    super("RPC call failed.");
    this.name = "RpcCallError";
  }
}

export async function callRpc<RpcName extends string>(
  client: SupabaseClient,
  rpcName: RpcName,
  parameters: { [key: string]: unknown },
): Promise<unknown> {
  const { data, error } = await client.rpc(rpcName, parameters);

  if (error !== null) {
    throw new RpcCallError(rpcName, error.code ?? null);
  }

  return data;
}
