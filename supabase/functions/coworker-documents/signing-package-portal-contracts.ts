import { createSigningPackageModelParsers } from "../_shared/coworker-document-edge/signing-package-model-parser.ts";
import type { SigningPackage } from "../_shared/coworker-document-edge/signing-package-models.ts";
import {
  BackendContractError,
  coworkerDocumentReaders,
} from "./contract-context.ts";
import {
  COWORKER_SIGNING_PACKAGE_RPC,
  type CoworkerSigningPackagePortal,
  type CoworkerSigningPackageRpcName,
  type SigningPackageUploadRecovery,
} from "./signing-package-contracts.ts";

const {
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendObject,
  backendPositiveInteger,
  backendString,
  backendTimestamp,
  backendUuid,
} = coworkerDocumentReaders;

const {
  parseSigningOnboardingCaseSummary,
  parseSigningPackage,
} = createSigningPackageModelParsers(
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
    "onboardingCase",
    "package",
    "uploadRecovery",
    "viewer",
  ]);
  const packageModel = parseNullablePackage(result.package, rpcName);
  const onboardingCase = parseSigningOnboardingCaseSummary(
    result.onboardingCase,
    rpcName,
  );
  const uploadRecovery = parseNullableUploadRecovery(
    result.uploadRecovery,
    rpcName,
  );
  const viewer = backendObject(result.viewer, rpcName, [
    "actorUserId",
    "isAdmin",
  ]);
  const parsed: CoworkerSigningPackagePortal = {
    userId: backendUuid(result, "userId", rpcName),
    onboardingCase,
    package: packageModel,
    uploadRecovery,
    viewer: {
      actorUserId: backendUuid(viewer, "actorUserId", rpcName),
      isAdmin: backendLiteral(viewer, "isAdmin", false, rpcName),
    },
  };

  if (
    parsed.userId !== userId ||
    parsed.onboardingCase.userId !== userId ||
    parsed.viewer.actorUserId !== userId ||
    (parsed.package !== null &&
      (parsed.package.userId !== userId ||
        parsed.package.onboardingCaseId !== parsed.onboardingCase.id)) ||
    !recoveryBelongsToPackage(parsed.uploadRecovery, parsed.package)
  ) {
    throw new BackendContractError(rpcName);
  }
  return parsed;
}

function parseNullablePackage(
  value: unknown,
  rpcName: CoworkerSigningPackageRpcName,
): SigningPackage | null {
  return value === null ? null : parseSigningPackage(value, rpcName);
}

function parseNullableUploadRecovery(
  value: unknown,
  rpcName: CoworkerSigningPackageRpcName,
): SigningPackageUploadRecovery | null {
  if (value === null) {
    return null;
  }
  const result = backendObject(value, rpcName, [
    "packageItemId",
    "uploadSessionId",
    "documentId",
    "documentVersionId",
    "originalFilename",
    "declaredMimeType",
    "expectedSizeBytes",
    "expiresAt",
    "canActivate",
    "canFinalize",
    "canCancel",
    "cleanupStatus",
  ]);
  return {
    packageItemId: backendUuid(result, "packageItemId", rpcName),
    uploadSessionId: backendUuid(result, "uploadSessionId", rpcName),
    documentId: backendUuid(result, "documentId", rpcName),
    documentVersionId: backendUuid(result, "documentVersionId", rpcName),
    originalFilename: backendString(result, "originalFilename", rpcName),
    declaredMimeType: backendString(result, "declaredMimeType", rpcName),
    expectedSizeBytes: backendPositiveInteger(
      result,
      "expectedSizeBytes",
      rpcName,
    ),
    expiresAt: backendTimestamp(result, "expiresAt", rpcName),
    canActivate: backendBoolean(result, "canActivate", rpcName),
    canFinalize: backendBoolean(result, "canFinalize", rpcName),
    canCancel: backendBoolean(result, "canCancel", rpcName),
    cleanupStatus: backendEnum(
      result,
      "cleanupStatus",
      ["not_required", "pending", "completed", "failed"] as const,
      rpcName,
    ),
  };
}

function recoveryBelongsToPackage(
  recovery: SigningPackageUploadRecovery | null,
  packageModel: SigningPackage | null,
): boolean {
  return recovery === null ||
    (packageModel !== null &&
      packageModel.items.some((item) => item.id === recovery.packageItemId));
}
