import type { RpcErrorDomain } from "../_shared/coworker-document-edge/error-response.ts";
import { isCoworkerSigningPackageRpcName } from "./signing-package-contracts.ts";

const COWORKER_ACCESS_DENIED = {
  status: 403,
  code: "COWORKER_ACCESS_DENIED",
  message: "Active coworker access is required.",
} as const;

export const SIGNING_PACKAGE_RPC_ERROR_CONTEXT = "signing_package";

const DOCUMENT_RPC_ERRORS: RpcErrorDomain = {
  accessDenied: COWORKER_ACCESS_DENIED,
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
    message: "The document service is unavailable.",
  },
};

const SIGNING_PACKAGE_RPC_ERRORS: RpcErrorDomain = {
  accessDenied: COWORKER_ACCESS_DENIED,
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
    message: "The signing package service is unavailable.",
  },
};

export function getRpcErrorDomain(
  rpcName: string,
  errorContext: string | null,
): RpcErrorDomain {
  return errorContext === SIGNING_PACKAGE_RPC_ERROR_CONTEXT ||
      isCoworkerSigningPackageRpcName(rpcName)
    ? SIGNING_PACKAGE_RPC_ERRORS
    : DOCUMENT_RPC_ERRORS;
}
