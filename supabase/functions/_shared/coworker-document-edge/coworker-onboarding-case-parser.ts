import { createContractReaders } from "./contract-readers.ts";
import {
  COWORKER_ACTIVE_ONBOARDING_STATUSES,
  type CoworkerOnboardingCase,
} from "./coworker-document-models.ts";

const ONBOARDING_CASE_KEYS = [
  "id",
  "userId",
  "status",
  "openedAt",
  "submittedAt",
  "reviewStartedAt",
  "needsCorrectionAt",
  "approvedAt",
  "suspendedAt",
  "closedAt",
  "revision",
  "createdAt",
  "updatedAt",
] as const;

type ContractReaders<Context> = ReturnType<
  typeof createContractReaders<Context>
>;

export function createCoworkerOnboardingCaseParser<Context>(
  readers: ContractReaders<Context>,
) {
  const {
    backendEnum,
    backendInteger,
    backendNullableTimestamp,
    backendObject,
    backendTimestamp,
    backendUuid,
  } = readers;

  function parseCoworkerOnboardingCase(
    value: unknown,
    context: Context,
  ): CoworkerOnboardingCase {
    const result = backendObject(value, context, ONBOARDING_CASE_KEYS);
    return {
      id: backendUuid(result, "id", context),
      userId: backendUuid(result, "userId", context),
      status: backendEnum(
        result,
        "status",
        COWORKER_ACTIVE_ONBOARDING_STATUSES,
        context,
      ),
      openedAt: backendTimestamp(result, "openedAt", context),
      submittedAt: backendNullableTimestamp(result, "submittedAt", context),
      reviewStartedAt: backendNullableTimestamp(
        result,
        "reviewStartedAt",
        context,
      ),
      needsCorrectionAt: backendNullableTimestamp(
        result,
        "needsCorrectionAt",
        context,
      ),
      approvedAt: backendNullableTimestamp(result, "approvedAt", context),
      suspendedAt: backendNullableTimestamp(result, "suspendedAt", context),
      closedAt: backendNullableTimestamp(result, "closedAt", context),
      revision: backendInteger(result, "revision", context),
      createdAt: backendTimestamp(result, "createdAt", context),
      updatedAt: backendTimestamp(result, "updatedAt", context),
    };
  }

  return { parseCoworkerOnboardingCase };
}
