import { createBackendContractReaders } from "./backend-contract-readers.ts";
import type { ContractReaderConfig } from "./contract-reader-foundation.ts";
import { createRequestContractReaders } from "./request-contract-readers.ts";

export type { UnknownObject } from "./contract-reader-foundation.ts";

export function createContractReaders<Context>(
  config: ContractReaderConfig<Context>,
) {
  return {
    ...createRequestContractReaders(config),
    ...createBackendContractReaders(config),
  };
}
