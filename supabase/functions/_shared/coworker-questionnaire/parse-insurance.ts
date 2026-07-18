import type { FieldErrors, InsuranceData } from "./contracts.ts";
import {
  requestNullableBoolean,
  requestNullableEnum,
  requestNullableString,
  requestObject,
} from "./request-reader.ts";

const KEYS = [
  "otherEmployment",
  "otherEmployerName",
  "otherEmploymentAtLeastMinimumWage",
  "studentUnder26",
  "schoolOrUniversityName",
  "otherMandateContract",
  "otherPrincipalName",
  "otherMandateContractSocialInsurance",
  "subjectToCompulsorySocialInsurance",
  "voluntarySicknessInsurance",
  "voluntarySicknessInsuranceJoinConfirmed",
  "voluntaryPensionDisabilityInsurance",
  "hasPensionOrDisabilityPensionRight",
  "disabilityDegree",
  "registeredAtEmploymentOffice",
  "employmentOfficeAddress",
] as const;

const YES_NO = ["yes", "no"] as const;
const JOIN_DECLINE = ["join", "decline"] as const;
const DISABILITY_DEGREES = [
  "none",
  "light",
  "moderate",
  "severe",
] as const;

export function parseInsurance(
  value: unknown,
  errors: FieldErrors,
): InsuranceData {
  const source = requestObject(
    value,
    "data.insurance",
    KEYS,
    [],
    errors,
  );

  return {
    otherEmployment: answer(source, "otherEmployment", errors),
    otherEmployerName: requestNullableString(
      source,
      "otherEmployerName",
      "data.insurance.otherEmployerName",
      errors,
    ),
    otherEmploymentAtLeastMinimumWage: answer(
      source,
      "otherEmploymentAtLeastMinimumWage",
      errors,
    ),
    studentUnder26: answer(source, "studentUnder26", errors),
    schoolOrUniversityName: requestNullableString(
      source,
      "schoolOrUniversityName",
      "data.insurance.schoolOrUniversityName",
      errors,
    ),
    otherMandateContract: answer(source, "otherMandateContract", errors),
    otherPrincipalName: requestNullableString(
      source,
      "otherPrincipalName",
      "data.insurance.otherPrincipalName",
      errors,
    ),
    otherMandateContractSocialInsurance: answer(
      source,
      "otherMandateContractSocialInsurance",
      errors,
    ),
    subjectToCompulsorySocialInsurance: answer(
      source,
      "subjectToCompulsorySocialInsurance",
      errors,
    ),
    voluntarySicknessInsurance: requestNullableEnum(
      source,
      "voluntarySicknessInsurance",
      "data.insurance.voluntarySicknessInsurance",
      JOIN_DECLINE,
      errors,
    ),
    voluntarySicknessInsuranceJoinConfirmed: requestNullableBoolean(
      source,
      "voluntarySicknessInsuranceJoinConfirmed",
      "data.insurance.voluntarySicknessInsuranceJoinConfirmed",
      errors,
    ),
    voluntaryPensionDisabilityInsurance: requestNullableEnum(
      source,
      "voluntaryPensionDisabilityInsurance",
      "data.insurance.voluntaryPensionDisabilityInsurance",
      JOIN_DECLINE,
      errors,
    ),
    hasPensionOrDisabilityPensionRight: answer(
      source,
      "hasPensionOrDisabilityPensionRight",
      errors,
    ),
    disabilityDegree: requestNullableEnum(
      source,
      "disabilityDegree",
      "data.insurance.disabilityDegree",
      DISABILITY_DEGREES,
      errors,
    ),
    registeredAtEmploymentOffice: answer(
      source,
      "registeredAtEmploymentOffice",
      errors,
    ),
    employmentOfficeAddress: requestNullableString(
      source,
      "employmentOfficeAddress",
      "data.insurance.employmentOfficeAddress",
      errors,
    ),
  };
}

function answer(
  source: { [key: string]: unknown },
  key: string,
  errors: FieldErrors,
) {
  return requestNullableEnum(
    source,
    key,
    `data.insurance.${key}`,
    YES_NO,
    errors,
  );
}
