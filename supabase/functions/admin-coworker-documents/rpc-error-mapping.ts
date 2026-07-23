import type { RpcErrorDomain } from "../_shared/coworker-document-edge/error-response.ts";
import { isSigningPackageRpcName } from "./signing-package-contracts.ts";
import { isSigningSourceRpcName } from "./signing-source-contracts.ts";

const DOCUMENT_RPC_ERRORS: RpcErrorDomain = {
  notFound: {
    status: 404,
    code: "DOCUMENT_RESOURCE_NOT_FOUND",
    message: "The requested document resource was not found.",
  },
  conflict: {
    status: 409,
    code: "DOCUMENT_CONFLICT",
    message: "The document operation conflicts with the current state.",
  },
  concurrent: {
    status: 409,
    code: "CONCURRENT_MODIFICATION",
    message: "The document changed concurrently. Reload and retry.",
  },
  invalidState: {
    status: 400,
    code: "DOCUMENT_STATE_INVALID",
    message: "The document request is invalid for the current state.",
  },
  unavailable: {
    status: 500,
    code: "BACKEND_ERROR",
    message: "The admin document service is unavailable.",
  },
};

const SIGNING_SOURCE_RPC_ERRORS: RpcErrorDomain = {
  notFound: {
    status: 404,
    code: "ONBOARDING_RESOURCE_NOT_FOUND",
    message: "The requested onboarding resource was not found.",
  },
  conflict: {
    status: 409,
    code: "ONBOARDING_CONFLICT",
    message: "The onboarding operation conflicts with the current state.",
  },
  concurrent: {
    status: 409,
    code: "CONCURRENT_MODIFICATION",
    message: "The onboarding resource changed concurrently. Reload and retry.",
  },
  invalidState: {
    status: 400,
    code: "ONBOARDING_STATE_INVALID",
    message: "The onboarding request is invalid for the current state.",
  },
  unavailable: {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "The signing source service is unavailable.",
  },
};

const SIGNING_PACKAGE_RPC_ERRORS: RpcErrorDomain = {
  ...SIGNING_SOURCE_RPC_ERRORS,
  unavailable: {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "The signing package service is unavailable.",
  },
};

export function getRpcErrorDomain(
  rpcName: string,
): RpcErrorDomain {
  if (isSigningSourceRpcName(rpcName)) {
    return SIGNING_SOURCE_RPC_ERRORS;
  }
  if (isSigningPackageRpcName(rpcName)) {
    return SIGNING_PACKAGE_RPC_ERRORS;
  }
  return DOCUMENT_RPC_ERRORS;
}
