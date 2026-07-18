import type {
  AdminQuestionnairePurpose,
  AdminQuestionnaireRequest,
  AdminQuestionnaireScope,
} from "./contracts.ts";
import {
  createFieldErrors,
  requestEnum,
  requestObject,
  requestString,
  requestUuid,
  throwIfRequestInvalid,
} from "./request-reader.ts";

const REQUEST_KEYS = ["action", "userId", "scope", "purpose"] as const;
const SCOPES: readonly AdminQuestionnaireScope[] = ["masked", "full"];
const PURPOSES: readonly AdminQuestionnairePurpose[] = [
  "contract_preparation",
  "payroll_processing",
  "legal_review",
  "data_correction",
];

export function parseAdminQuestionnaireRequest(
  value: unknown,
): AdminQuestionnaireRequest {
  const errors = createFieldErrors();
  const source = requestObject(value, "", REQUEST_KEYS, [], errors);
  const action = requestString(source, "action", "action", errors);
  if (action !== "getQuestionnaire") {
    errors.action = "Value is not allowed.";
  }

  const request: AdminQuestionnaireRequest = {
    action: "getQuestionnaire",
    userId: requestUuid(source, "userId", "userId", errors),
    scope: requestEnum(source, "scope", "scope", SCOPES, errors),
    purpose: requestEnum(source, "purpose", "purpose", PURPOSES, errors),
  };
  throwIfRequestInvalid(errors);
  return request;
}
