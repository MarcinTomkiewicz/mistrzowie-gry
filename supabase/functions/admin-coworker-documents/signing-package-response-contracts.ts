import type { SigningPackage } from "../_shared/coworker-document-edge/signing-package-models.ts";
import { createSigningPackageModelParsers } from "../_shared/coworker-document-edge/signing-package-model-parser.ts";
import {
  type CoworkerDocumentExternalDelivery,
  type IssueSigningPackageResult,
  SIGNING_PACKAGE_RPC,
  SigningPackageBackendContractError,
  signingPackageReaders,
} from "./signing-package-contracts.ts";

const {
  backendArrayValue,
  backendBoolean,
  backendEnum,
  backendLiteral,
  backendNullableString,
  backendObject,
  backendTimestamp,
  backendUuid,
} = signingPackageReaders;

const { parseSigningPackage } = createSigningPackageModelParsers(
  signingPackageReaders,
  (rpcName) => new SigningPackageBackendContractError(rpcName),
);

export interface ExternalDeliveryExpectation {
  userId: string;
  onboardingCaseId: string;
  documentId: string;
  documentVersionId: string;
}

export function parseExternalDelivery(
  value: unknown,
  expected: ExternalDeliveryExpectation,
): CoworkerDocumentExternalDelivery {
  const rpcName = SIGNING_PACKAGE_RPC.recordQuestionnaireDelivery;
  const result = backendObject(value, rpcName, [
    "id",
    "userId",
    "onboardingCaseId",
    "documentId",
    "documentVersionId",
    "destination",
    "deliveryType",
    "deliveredAt",
    "deliveredBy",
    "note",
  ]);
  const parsed: CoworkerDocumentExternalDelivery = {
    id: backendUuid(result, "id", rpcName),
    userId: backendUuid(result, "userId", rpcName),
    onboardingCaseId: backendUuid(result, "onboardingCaseId", rpcName),
    documentId: backendUuid(result, "documentId", rpcName),
    documentVersionId: backendUuid(result, "documentVersionId", rpcName),
    destination: backendLiteral(result, "destination", "accounting", rpcName),
    deliveryType: backendEnum(
      result,
      "deliveryType",
      ["onboarding_questionnaire", "questionnaire_update", "other"] as const,
      rpcName,
    ),
    deliveredAt: backendTimestamp(result, "deliveredAt", rpcName),
    deliveredBy: backendUuid(result, "deliveredBy", rpcName),
    note: backendNullableString(result, "note", rpcName),
  };

  if (
    parsed.userId !== expected.userId ||
    parsed.onboardingCaseId !== expected.onboardingCaseId ||
    parsed.documentId !== expected.documentId ||
    parsed.documentVersionId !== expected.documentVersionId
  ) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}

export function parseIssueSigningPackageResult(
  value: unknown,
  userId: string,
  onboardingCaseId: string,
): IssueSigningPackageResult {
  const rpcName = SIGNING_PACKAGE_RPC.issuePackage;
  const result = backendObject(value, rpcName, [
    "issued",
    "idempotent",
    "package",
  ]);
  const parsed: IssueSigningPackageResult = {
    issued: backendLiteral(result, "issued", true, rpcName),
    idempotent: backendBoolean(result, "idempotent", rpcName),
    package: parseSigningPackage(result.package, rpcName),
  };

  if (
    parsed.package.userId !== userId ||
    parsed.package.onboardingCaseId !== onboardingCaseId
  ) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}

export function parseAdminSigningPackageList(
  value: unknown,
): SigningPackage[] {
  const rpcName = SIGNING_PACKAGE_RPC.getPackageList;
  const packages = backendArrayValue(value, rpcName).map((item) =>
    parseSigningPackage(item, rpcName)
  );

  if (new Set(packages.map((item) => item.id)).size !== packages.length) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return packages;
}

export function parseSigningPackageDetail(
  value: unknown,
  packageId: string,
): SigningPackage {
  const rpcName = SIGNING_PACKAGE_RPC.getPackageDetail;
  const parsed = parseSigningPackage(value, rpcName);

  if (parsed.id !== packageId) {
    throw new SigningPackageBackendContractError(rpcName);
  }
  return parsed;
}
