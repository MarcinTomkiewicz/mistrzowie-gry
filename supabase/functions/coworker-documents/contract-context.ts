import { createContractReaders } from "../_shared/coworker-document-edge/contract-readers.ts";

export type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";

export class RequestValidationError extends Error {
  constructor(readonly fieldErrors: { [field: string]: string }) {
    super("Document request validation failed.");
    this.name = "RequestValidationError";
  }
}

export class BackendContractError extends Error {
  constructor(readonly rpcName: string | null = null) {
    super("Backend contract validation failed.");
    this.name = "BackendContractError";
  }
}

export const coworkerDocumentReaders = createContractReaders<string | null>({
  createRequestError: (fieldErrors) =>
    new RequestValidationError(fieldErrors),
  createBackendError: (rpcName) => new BackendContractError(rpcName),
  allowEmptyBackendNullableString: false,
});
