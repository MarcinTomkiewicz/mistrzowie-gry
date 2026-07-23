export interface ErrorDefinition {
  status: number;
  code: string;
  message: string;
}

export interface RpcErrorDomain {
  accessDenied: ErrorDefinition;
  notFound: ErrorDefinition;
  conflict: ErrorDefinition;
  concurrent: ErrorDefinition;
  invalidState: ErrorDefinition;
  unavailable: ErrorDefinition;
  foreignKeyConflict?: ErrorDefinition;
}

export function mapRpcError(
  sqlState: string | null,
  domain: RpcErrorDomain,
): ErrorDefinition {
  switch (sqlState) {
    case "42501":
      return domain.accessDenied;
    case "P0002":
      return domain.notFound;
    case "23505":
      return domain.conflict;
    case "23503":
      return domain.foreignKeyConflict ?? domain.unavailable;
    case "40001":
      return domain.concurrent;
    case "22023":
    case "22P02":
    case "22007":
    case "23514":
      return domain.invalidState;
    default:
      return domain.unavailable;
  }
}

export function createLoggedErrorResponse(
  status: number,
  code: string,
  message: string,
  requestId: string,
  extra?: { [key: string]: unknown },
  storageOperation?: string,
  rpcName?: string | null,
): Response {
  const logEntry: {
    code: string;
    requestId: string;
    rpcName?: string;
    status: number;
    storageOperation?: string;
  } = { code, requestId, status };

  if (rpcName !== undefined && rpcName !== null) {
    logEntry.rpcName = rpcName;
  }
  if (storageOperation !== undefined) {
    logEntry.storageOperation = storageOperation;
  }

  console.error(JSON.stringify(logEntry));

  return Response.json(
    {
      ok: false,
      code,
      message,
      ...(extra ?? {}),
    },
    { status },
  );
}
