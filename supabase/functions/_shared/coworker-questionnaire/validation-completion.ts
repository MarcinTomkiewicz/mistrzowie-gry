import type {
  FieldErrors,
  InsuranceData,
  QuestionnairePayload,
} from "./contracts.ts";

const POLISH_POSTAL_CODE_PATTERN = /^\d{2}-\d{3}$/;

export function validateCompletion(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): void {
  validatePersonal(payload, errors);
  validateRegisteredAddress(payload, errors);
  validateCorrespondenceAddress(payload, errors);
  validateInstitutions(payload, errors);
  validateInsurance(payload.insurance, errors);
  requireNonBlank(payload.payment.bankName, "data.payment.bankName", errors);
  requireNonBlank(
    payload.payment.bankAccount,
    "data.payment.bankAccount",
    errors,
  );
}

function validatePersonal(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): void {
  const personal = payload.personal;
  for (const [key, value] of [
    ["firstName", personal.firstName],
    ["lastName", personal.lastName],
    ["birthDate", personal.birthDate],
    ["birthPlace", personal.birthPlace],
    ["citizenship", personal.citizenship],
    ["phone", personal.phone],
  ] as const) {
    requireNonBlank(value, `data.personal.${key}`, errors);
  }

  if (personal.identificationBasis === null) {
    errors["data.personal.identificationBasis"] = "Answer is required.";
  } else if (
    personal.identificationBasis === "pesel" &&
    personal.pesel === null
  ) {
    errors["data.personal.pesel"] = "PESEL is required.";
  } else if (personal.identificationBasis === "identity_document") {
    if (personal.identityDocumentKind === null) {
      errors["data.personal.identityDocumentKind"] =
        "Document kind is required.";
    }
    if (personal.identityDocumentNumber === null) {
      errors["data.personal.identityDocumentNumber"] =
        "Document number is required.";
    }
  }
}

function validateRegisteredAddress(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): void {
  const address = payload.registeredAddress;
  for (const [key, value] of [
    ["street", address.street],
    ["houseNumber", address.houseNumber],
    ["postalCode", address.postalCode],
    ["city", address.city],
  ] as const) {
    requireNonBlank(value, `data.registeredAddress.${key}`, errors);
  }
  requireCurrentCountry(
    address.countryCode,
    address.legacyCountryName,
    "data.registeredAddress",
    errors,
  );

  if (address.countryCode === "PL") {
    if (
      address.postalCode !== null &&
      address.postalCode !== "" &&
      !POLISH_POSTAL_CODE_PATTERN.test(address.postalCode)
    ) {
      errors["data.registeredAddress.postalCode"] =
        "Polish postal code must use NN-NNN format.";
    }
    for (const [key, value] of [
      ["voivodeship", address.voivodeship],
      ["county", address.county],
      ["municipality", address.municipality],
      ["postOffice", address.postOffice],
    ] as const) {
      requireNonBlank(value, `data.registeredAddress.${key}`, errors);
    }
  }
}

function validateCorrespondenceAddress(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): void {
  const address = payload.correspondenceAddress;
  if (address.sameAsRegistered) {
    return;
  }
  for (const [key, value] of [
    ["street", address.street],
    ["houseNumber", address.houseNumber],
    ["postalCode", address.postalCode],
    ["city", address.city],
  ] as const) {
    requireNonBlank(value, `data.correspondenceAddress.${key}`, errors);
  }
  requireCurrentCountry(
    address.countryCode,
    address.legacyCountryName,
    "data.correspondenceAddress",
    errors,
  );

  if (
    address.countryCode === "PL" &&
    address.postalCode !== null &&
    address.postalCode !== "" &&
    !POLISH_POSTAL_CODE_PATTERN.test(address.postalCode)
  ) {
    errors["data.correspondenceAddress.postalCode"] =
      "Polish postal code must use NN-NNN format.";
  }
}

function validateInstitutions(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): void {
  for (const [key, reference] of [
    ["taxOffice", payload.institutions.taxOffice],
    ["nfzBranch", payload.institutions.nfzBranch],
  ] as const) {
    if (reference === null) {
      errors[`data.institutions.${key}`] = "Catalog reference is required.";
    } else if (reference.kind === "legacy") {
      errors[`data.institutions.${key}`] =
        "Legacy reference must be replaced before completion.";
    }
  }
}

function validateInsurance(
  insurance: InsuranceData,
  errors: FieldErrors,
): void {
  for (const key of [
    "otherEmployment",
    "studentUnder26",
    "otherMandateContract",
    "subjectToCompulsorySocialInsurance",
    "voluntarySicknessInsurance",
    "voluntaryPensionDisabilityInsurance",
    "hasPensionOrDisabilityPensionRight",
    "disabilityDegree",
    "registeredAtEmploymentOffice",
  ] as const) {
    if (insurance[key] === null) {
      errors[`data.insurance.${key}`] = "Answer is required.";
    }
  }

  if (insurance.otherEmployment === "yes") {
    requireNonBlank(
      insurance.otherEmployerName,
      "data.insurance.otherEmployerName",
      errors,
    );
    requireAnswer(
      insurance.otherEmploymentAtLeastMinimumWage,
      "data.insurance.otherEmploymentAtLeastMinimumWage",
      errors,
    );
  }
  if (insurance.studentUnder26 === "yes") {
    requireNonBlank(
      insurance.schoolOrUniversityName,
      "data.insurance.schoolOrUniversityName",
      errors,
    );
  }
  if (insurance.otherMandateContract === "yes") {
    requireNonBlank(
      insurance.otherPrincipalName,
      "data.insurance.otherPrincipalName",
      errors,
    );
    requireAnswer(
      insurance.otherMandateContractSocialInsurance,
      "data.insurance.otherMandateContractSocialInsurance",
      errors,
    );
  }
  if (insurance.registeredAtEmploymentOffice === "yes") {
    requireNonBlank(
      insurance.employmentOfficeAddress,
      "data.insurance.employmentOfficeAddress",
      errors,
    );
  }
  if (
    insurance.voluntarySicknessInsurance === "join" &&
    insurance.voluntarySicknessInsuranceJoinConfirmed !== true
  ) {
    errors["data.insurance.voluntarySicknessInsuranceJoinConfirmed"] =
      "Joining sickness insurance must be confirmed.";
  }
}

function requireCurrentCountry(
  countryCode: string | null,
  legacyCountryName: string | null,
  path: string,
  errors: FieldErrors,
): void {
  if (countryCode === null) {
    errors[`${path}.countryCode`] = "Country code is required.";
  }
  if (legacyCountryName !== null) {
    errors[`${path}.legacyCountryName`] =
      "Legacy country must be replaced before completion.";
  }
}

function requireNonBlank(
  value: string | null,
  path: string,
  errors: FieldErrors,
): void {
  if (value === null || value.trim() === "") {
    errors[path] = "Field is required.";
  }
}

function requireAnswer(
  value: "yes" | "no" | null,
  path: string,
  errors: FieldErrors,
): void {
  if (value === null) {
    errors[path] = "Answer is required.";
  }
}
