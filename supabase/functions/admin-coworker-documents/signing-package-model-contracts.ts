import { createSigningPackageModelParsers } from "../_shared/coworker-document-edge/signing-package-model-parser.ts";
import {
  SigningPackageBackendContractError,
  signingPackageReaders,
} from "./signing-package-contracts.ts";

export const {
  parseSigningCoworkerSummary,
  parseSigningOnboardingCaseSummary,
  parseSigningPackage,
} = createSigningPackageModelParsers(
  signingPackageReaders,
  (rpcName) => new SigningPackageBackendContractError(rpcName),
);
