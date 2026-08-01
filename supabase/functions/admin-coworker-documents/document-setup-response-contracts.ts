import type { UnknownObject } from "../_shared/coworker-document-edge/contract-readers.ts";
import {
  adminDocumentReaders,
  BackendContractError,
  RPC,
} from "./contracts.ts";

const {
  backendBoolean,
  backendNonNegativeInteger,
  backendObject,
  backendString,
  backendUuid,
} = adminDocumentReaders;

export function parseSavedDefinition(value: unknown): UnknownObject {
  const definition = backendObject(value, RPC.saveDefinition);
  backendUuid(definition, "id", RPC.saveDefinition);
  backendString(definition, "code", RPC.saveDefinition);
  backendString(definition, "title", RPC.saveDefinition);
  return definition;
}

export function parseOnboardingResult(
  value: unknown,
  userId: string,
): UnknownObject {
  const result = backendObject(value, RPC.ensureOnboarding);
  backendBoolean(result, "created", RPC.ensureOnboarding);
  const onboardingCase = backendObject(result.case, RPC.ensureOnboarding);
  backendUuid(onboardingCase, "id", RPC.ensureOnboarding);

  if (
    backendUuid(onboardingCase, "userId", RPC.ensureOnboarding) !== userId
  ) {
    throw new BackendContractError(RPC.ensureOnboarding);
  }
  return result;
}

export function parseSeedRequirementsResult(
  value: unknown,
  userId: string,
  onboardingCaseId: string,
): UnknownObject {
  const result = backendObject(value, RPC.seedDefaultRequirements);
  if (
    backendUuid(result, "userId", RPC.seedDefaultRequirements) !== userId ||
    backendUuid(result, "onboardingCaseId", RPC.seedDefaultRequirements) !==
      onboardingCaseId
  ) {
    throw new BackendContractError(RPC.seedDefaultRequirements);
  }
  backendNonNegativeInteger(
    result,
    "insertedCount",
    RPC.seedDefaultRequirements,
  );
  return result;
}

export function parseRequirementResult(
  value: unknown,
  userId: string,
): UnknownObject {
  const requirement = backendObject(value, RPC.assignRequirement);
  backendUuid(requirement, "id", RPC.assignRequirement);
  if (
    backendUuid(requirement, "userId", RPC.assignRequirement) !== userId
  ) {
    throw new BackendContractError(RPC.assignRequirement);
  }
  return requirement;
}
