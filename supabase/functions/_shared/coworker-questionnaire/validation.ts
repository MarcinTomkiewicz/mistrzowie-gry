import type { QuestionnairePayload } from "./contracts.ts";
import { QuestionnaireValidationError } from "./errors.ts";
import { normalizeQuestionnairePayload } from "./normalization.ts";
import { createFieldErrors } from "./request-reader.ts";
import { validateCompletion } from "./validation-completion.ts";
import {
  validateAddressRules,
  validateInstitutionRules,
  validateInsuranceRules,
} from "./validation-rules.ts";

export function validateQuestionnairePayload(
  payload: QuestionnairePayload,
  complete: boolean,
): QuestionnairePayload {
  const errors = createFieldErrors();
  const normalized = normalizeQuestionnairePayload(payload, errors);

  validateAddressRules(normalized, errors);
  validateInstitutionRules(normalized.institutions, errors);
  validateInsuranceRules(normalized.insurance, errors);
  if (complete) {
    validateCompletion(normalized, errors);
  }

  if (Object.keys(errors).length > 0) {
    throw new QuestionnaireValidationError(errors);
  }
  return normalized;
}
