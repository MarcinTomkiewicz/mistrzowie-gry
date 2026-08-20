import type {
  FieldErrors,
  InstitutionReference,
  InstitutionsData,
  InsuranceData,
  QuestionnairePayload,
} from "./contracts.ts";

export function validateAddressRules(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): void {
  validateCountry(
    payload.registeredAddress.countryCode,
    payload.registeredAddress.legacyCountryName,
    "data.registeredAddress",
    errors,
  );
  validateCountry(
    payload.correspondenceAddress.countryCode,
    payload.correspondenceAddress.legacyCountryName,
    "data.correspondenceAddress",
    errors,
  );

  if (payload.correspondenceAddress.sameAsRegistered) {
    const dependentKeys = [
      "street",
      "houseNumber",
      "apartmentNumber",
      "postalCode",
      "city",
      "countryCode",
      "legacyCountryName",
    ] as const;
    for (const key of dependentKeys) {
      if (payload.correspondenceAddress[key] !== null) {
        errors[`data.correspondenceAddress.${key}`] =
          "Value must be null when the registered address is reused.";
      }
    }
  }
}

export function validateInstitutionRules(
  institutions: InstitutionsData,
  errors: FieldErrors,
): void {
  validateReference(
    institutions.taxOffice,
    "data.institutions.taxOffice",
    /^\d{4}$/,
    errors,
  );
  validateReference(
    institutions.nfzBranch,
    "data.institutions.nfzBranch",
    /^(?:0[1-9]|1[0-6])$/,
    errors,
  );
}

export function validateInsuranceRules(
  insurance: InsuranceData,
  errors: FieldErrors,
): void {
  requireNullUnlessYes(
    insurance.otherEmployment,
    [
      ["otherEmployerName", insurance.otherEmployerName],
      [
        "otherEmploymentAtLeastMinimumWage",
        insurance.otherEmploymentAtLeastMinimumWage,
      ],
    ],
    errors,
  );
  requireNullUnlessYes(
    insurance.studentUnder26,
    [["schoolOrUniversityName", insurance.schoolOrUniversityName]],
    errors,
  );
  requireNullUnlessYes(
    insurance.otherMandateContract,
    [
      ["otherPrincipalName", insurance.otherPrincipalName],
      [
        "otherMandateContractSocialInsurance",
        insurance.otherMandateContractSocialInsurance,
      ],
    ],
    errors,
  );
  requireNullUnlessYes(
    insurance.registeredAtEmploymentOffice,
    [["employmentOfficeAddress", insurance.employmentOfficeAddress]],
    errors,
  );

  const isStudentUnder26 = insurance.studentUnder26 === "yes";
  const compulsoryInsuranceExcluded = isStudentUnder26 ||
    (insurance.otherEmployment === "yes" &&
      insurance.otherEmploymentAtLeastMinimumWage === "yes");
  if (
    compulsoryInsuranceExcluded &&
    insurance.subjectToCompulsorySocialInsurance !== "no"
  ) {
    errors["data.insurance.subjectToCompulsorySocialInsurance"] =
      "Value must be no when compulsory social insurance is excluded.";
  }

  const sicknessInsuranceActive = !isStudentUnder26 &&
    insurance.subjectToCompulsorySocialInsurance === "yes";
  if (
    !sicknessInsuranceActive &&
    insurance.voluntarySicknessInsurance !== null
  ) {
    errors["data.insurance.voluntarySicknessInsurance"] =
      "Value must be null when sickness insurance is inactive.";
  }
  if (
    !sicknessInsuranceActive &&
    insurance.voluntarySicknessInsuranceJoinConfirmed !== null
  ) {
    errors["data.insurance.voluntarySicknessInsuranceJoinConfirmed"] =
      "Value must be null when sickness insurance is inactive.";
  }
  if (
    sicknessInsuranceActive &&
    insurance.voluntarySicknessInsurance !== "join" &&
    insurance.voluntarySicknessInsuranceJoinConfirmed !== null
  ) {
    errors["data.insurance.voluntarySicknessInsuranceJoinConfirmed"] =
      "Value must be null when sickness insurance is not joined.";
  }

  const pensionDisabilityInsuranceActive = !isStudentUnder26 &&
    insurance.subjectToCompulsorySocialInsurance === "no";
  if (
    !pensionDisabilityInsuranceActive &&
    insurance.voluntaryPensionDisabilityInsurance !== null
  ) {
    errors["data.insurance.voluntaryPensionDisabilityInsurance"] =
      "Value must be null when pension and disability insurance is inactive.";
  }
}

function validateCountry(
  countryCode: string | null,
  legacyCountryName: string | null,
  path: string,
  errors: FieldErrors,
): void {
  if (countryCode !== null && legacyCountryName !== null) {
    errors[`${path}.countryCode`] =
      "Country code and legacy country name are mutually exclusive.";
    errors[`${path}.legacyCountryName`] =
      "Country code and legacy country name are mutually exclusive.";
  }
}

function validateReference(
  reference: InstitutionReference,
  path: string,
  codePattern: RegExp,
  errors: FieldErrors,
): void {
  if (reference === null) {
    return;
  }
  if (reference.name.trim() === "") {
    errors[`${path}.name`] = "Reference name cannot be blank.";
  }
  if (reference.kind === "catalog" && !codePattern.test(reference.code)) {
    errors[`${path}.code`] = "Catalog code is invalid.";
  }
}

function requireNullUnlessYes(
  controllingValue: "yes" | "no" | null,
  dependentValues: ReadonlyArray<readonly [string, unknown]>,
  errors: FieldErrors,
): void {
  if (controllingValue === "yes") {
    return;
  }
  for (const [key, value] of dependentValues) {
    if (value !== null) {
      errors[`data.insurance.${key}`] =
        "Value must be null when the controlling answer is not yes.";
    }
  }
}
