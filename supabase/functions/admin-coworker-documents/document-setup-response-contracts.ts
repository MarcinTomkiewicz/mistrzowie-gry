import { createCoworkerDocumentDefinitionParser } from "../_shared/coworker-document-edge/coworker-document-definition-parser.ts";
import {
  COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
  type CoworkerDocumentDefinition,
  type CoworkerOnboardingCase,
} from "../_shared/coworker-document-edge/coworker-document-models.ts";
import { createCoworkerOnboardingCaseParser } from "../_shared/coworker-document-edge/coworker-onboarding-case-parser.ts";
import {
  adminDocumentReaders,
  BackendContractError,
  RPC,
} from "./contracts.ts";

const {
  backendBoolean,
  backendEnum,
  backendNonNegativeInteger,
  backendNullableString,
  backendNullableTimestamp,
  backendNullableUuid,
  backendObject,
  backendTimestamp,
  backendUuid,
} = adminDocumentReaders;
const { parseCoworkerDocumentDefinition } =
  createCoworkerDocumentDefinitionParser(adminDocumentReaders);
const { parseCoworkerOnboardingCase } = createCoworkerOnboardingCaseParser(
  adminDocumentReaders,
);

export interface AdminOnboardingResult {
  created: boolean;
  case: CoworkerOnboardingCase;
}

export interface SeedRequirementsResult {
  userId: string;
  onboardingCaseId: string;
  insertedCount: number;
}

export interface AdminDocumentRequirementResult {
  id: string;
  userId: string;
  onboardingCaseId: string | null;
  documentDefinitionId: string;
  status: typeof COWORKER_DOCUMENT_REQUIREMENT_STATUSES[number];
  required: boolean;
  dueAt: string | null;
  fulfilledByDocumentId: string | null;
  fulfilledAt: string | null;
  waivedAt: string | null;
  waiverReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export function parseSavedDefinition(
  value: unknown,
): CoworkerDocumentDefinition {
  return parseCoworkerDocumentDefinition(value, RPC.saveDefinition);
}

export function parseOnboardingResult(
  value: unknown,
  userId: string,
): AdminOnboardingResult {
  const result = backendObject(value, RPC.ensureOnboarding, [
    "created",
    "case",
  ]);
  const onboardingCase = parseCoworkerOnboardingCase(
    result.case,
    RPC.ensureOnboarding,
  );

  if (onboardingCase.userId !== userId) {
    throw new BackendContractError(RPC.ensureOnboarding);
  }
  return {
    created: backendBoolean(result, "created", RPC.ensureOnboarding),
    case: onboardingCase,
  };
}

export function parseSeedRequirementsResult(
  value: unknown,
  userId: string,
  onboardingCaseId: string,
): SeedRequirementsResult {
  const result = backendObject(value, RPC.seedDefaultRequirements, [
    "userId",
    "onboardingCaseId",
    "insertedCount",
  ]);
  const parsedUserId = backendUuid(
    result,
    "userId",
    RPC.seedDefaultRequirements,
  );
  const parsedOnboardingCaseId = backendUuid(
    result,
    "onboardingCaseId",
    RPC.seedDefaultRequirements,
  );
  const insertedCount = backendNonNegativeInteger(
    result,
    "insertedCount",
    RPC.seedDefaultRequirements,
  );
  if (
    parsedUserId !== userId ||
    parsedOnboardingCaseId !== onboardingCaseId
  ) {
    throw new BackendContractError(RPC.seedDefaultRequirements);
  }
  return {
    userId: parsedUserId,
    onboardingCaseId: parsedOnboardingCaseId,
    insertedCount,
  };
}

export function parseRequirementResult(
  value: unknown,
  userId: string,
): AdminDocumentRequirementResult {
  const requirement = backendObject(value, RPC.assignRequirement, [
    "id",
    "userId",
    "onboardingCaseId",
    "documentDefinitionId",
    "status",
    "required",
    "dueAt",
    "fulfilledByDocumentId",
    "fulfilledAt",
    "waivedAt",
    "waiverReason",
    "createdAt",
    "updatedAt",
  ]);
  const parsedUserId = backendUuid(
    requirement,
    "userId",
    RPC.assignRequirement,
  );
  if (parsedUserId !== userId) {
    throw new BackendContractError(RPC.assignRequirement);
  }
  return {
    id: backendUuid(requirement, "id", RPC.assignRequirement),
    userId: parsedUserId,
    onboardingCaseId: backendNullableUuid(
      requirement,
      "onboardingCaseId",
      RPC.assignRequirement,
    ),
    documentDefinitionId: backendUuid(
      requirement,
      "documentDefinitionId",
      RPC.assignRequirement,
    ),
    status: backendEnum(
      requirement,
      "status",
      COWORKER_DOCUMENT_REQUIREMENT_STATUSES,
      RPC.assignRequirement,
    ),
    required: backendBoolean(requirement, "required", RPC.assignRequirement),
    dueAt: backendNullableTimestamp(
      requirement,
      "dueAt",
      RPC.assignRequirement,
    ),
    fulfilledByDocumentId: backendNullableUuid(
      requirement,
      "fulfilledByDocumentId",
      RPC.assignRequirement,
    ),
    fulfilledAt: backendNullableTimestamp(
      requirement,
      "fulfilledAt",
      RPC.assignRequirement,
    ),
    waivedAt: backendNullableTimestamp(
      requirement,
      "waivedAt",
      RPC.assignRequirement,
    ),
    waiverReason: backendNullableString(
      requirement,
      "waiverReason",
      RPC.assignRequirement,
    ),
    createdAt: backendTimestamp(
      requirement,
      "createdAt",
      RPC.assignRequirement,
    ),
    updatedAt: backendTimestamp(
      requirement,
      "updatedAt",
      RPC.assignRequirement,
    ),
  };
}
