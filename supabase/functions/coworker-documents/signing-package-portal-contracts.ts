import { createSigningPackageModelParsers } from "../_shared/coworker-document-edge/signing-package-model-parser.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
} from "./contract-context.ts";
import {
  COWORKER_SIGNING_PACKAGE_RPC,
  type CoworkerSigningPackagePortal,
} from "./signing-package-contracts.ts";

const { backendArrayValue, backendObject, backendUuid } =
  coworkerDocumentReaders;

const { parseSigningPackage } = createSigningPackageModelParsers(
  coworkerDocumentReaders,
  (rpcName) => new BackendContractError(rpcName),
);

export function parseCoworkerSigningPackagePortal(
  value: unknown,
  userId: string,
): CoworkerSigningPackagePortal {
  const rpcName = COWORKER_SIGNING_PACKAGE_RPC.getPortal;
  const result = backendObject(value, rpcName, [
    "userId",
    "packages",
    "activePackage",
  ]);
  const packages = backendArrayValue(result.packages, rpcName).map((item) =>
    parseSigningPackage(item, rpcName)
  );
  const activePackage = result.activePackage === null
    ? null
    : parseSigningPackage(result.activePackage, rpcName);
  const parsed: CoworkerSigningPackagePortal = {
    userId: backendUuid(result, "userId", rpcName),
    packages,
    activePackage,
  };

  if (
    parsed.userId !== userId ||
    packages.some((packageModel) => packageModel.userId !== userId) ||
    new Set(packages.map((packageModel) => packageModel.id)).size !==
      packages.length ||
    (activePackage !== null && activePackage.userId !== userId)
  ) {
    throw new BackendContractError(rpcName);
  }
  return parsed;
}
