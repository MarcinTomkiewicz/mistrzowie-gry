import type {
  CorrespondenceAddressData,
  FieldErrors,
  InstitutionReference,
  InstitutionsData,
  InsuranceData,
  PaymentData,
  PersonalData,
  QuestionnairePayload,
  RegisteredAddressData,
} from "./contracts.ts";
import {
  containsControlCharacters,
  getPeselBirthDate,
  isIsoCountryCode,
  isValidIsoDate,
  isValidNip,
  normalizeBankAccount,
  normalizePesel,
} from "./validators.ts";

export function normalizeQuestionnairePayload(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): QuestionnairePayload {
  return {
    personal: normalizePersonal(payload.personal, errors),
    registeredAddress: normalizeRegisteredAddress(
      payload.registeredAddress,
      errors,
    ),
    correspondenceAddress: normalizeCorrespondenceAddress(
      payload.correspondenceAddress,
      errors,
    ),
    institutions: normalizeInstitutions(payload.institutions, errors),
    insurance: normalizeInsurance(payload.insurance, errors),
    payment: normalizePayment(payload.payment, errors),
  };
}

function normalizePersonal(
  personal: PersonalData,
  errors: FieldErrors,
): PersonalData {
  const birthDate = normalizeText(
    personal.birthDate,
    "data.personal.birthDate",
    errors,
  );
  const validBirthDate = birthDate !== "" && isValidIsoDate(birthDate);
  if (birthDate !== "" && !validBirthDate) {
    errors["data.personal.birthDate"] =
      "Date must use a valid YYYY-MM-DD value.";
  }

  const peselInput = normalizeNullableText(
    personal.pesel,
    "data.personal.pesel",
    errors,
  );
  const pesel = peselInput === null ? null : normalizePesel(peselInput);
  if (pesel !== null) {
    const peselBirthDate = getPeselBirthDate(pesel);
    if (peselBirthDate === null) {
      errors["data.personal.pesel"] = "PESEL is invalid.";
    } else if (validBirthDate && birthDate !== peselBirthDate) {
      errors["data.personal.birthDate"] = "Birth date must match PESEL.";
    }
  }

  const nipInput = normalizeNullableText(
    personal.nip,
    "data.personal.nip",
    errors,
  );
  const nip = nipInput?.replace(/[ -]/g, "") ?? null;
  if (nip !== null && !isValidNip(nip)) {
    errors["data.personal.nip"] = "NIP is invalid.";
  }

  const documentInput = normalizeNullableText(
    personal.identityDocumentNumber,
    "data.personal.identityDocumentNumber",
    errors,
  );
  const identityDocumentNumber = documentInput?.toUpperCase() ?? null;
  if (
    identityDocumentNumber !== null &&
    (identityDocumentNumber.length < 3 || identityDocumentNumber.length > 32)
  ) {
    errors["data.personal.identityDocumentNumber"] =
      "Document number must contain between 3 and 32 characters.";
  }

  return {
    ...personal,
    firstName: normalizeText(personal.firstName, "data.personal.firstName", errors, 150),
    lastName: normalizeText(personal.lastName, "data.personal.lastName", errors, 150),
    maidenName: normalizeNullableText(personal.maidenName, "data.personal.maidenName", errors, 150),
    middleName: normalizeNullableText(personal.middleName, "data.personal.middleName", errors, 150),
    birthDate,
    birthPlace: normalizeText(personal.birthPlace, "data.personal.birthPlace", errors, 150),
    pesel,
    nip,
    identityDocumentNumber,
    citizenship: normalizeText(personal.citizenship, "data.personal.citizenship", errors, 150),
    phone: normalizeText(personal.phone, "data.personal.phone", errors, 50),
  };
}

function normalizeRegisteredAddress(
  address: RegisteredAddressData,
  errors: FieldErrors,
): RegisteredAddressData {
  const path = "data.registeredAddress";
  return {
    street: normalizeText(address.street, `${path}.street`, errors, 200),
    houseNumber: normalizeText(address.houseNumber, `${path}.houseNumber`, errors, 50),
    apartmentNumber: normalizeNullableText(
      address.apartmentNumber,
      `${path}.apartmentNumber`,
      errors,
      50,
    ),
    postalCode: normalizeText(address.postalCode, `${path}.postalCode`, errors, 30),
    city: normalizeText(address.city, `${path}.city`, errors, 150),
    voivodeship: normalizeNullableText(address.voivodeship, `${path}.voivodeship`, errors, 150),
    county: normalizeNullableText(address.county, `${path}.county`, errors, 150),
    municipality: normalizeNullableText(address.municipality, `${path}.municipality`, errors, 150),
    postOffice: normalizeNullableText(address.postOffice, `${path}.postOffice`, errors, 150),
    countryCode: normalizeCountryCode(address.countryCode, `${path}.countryCode`, errors),
    legacyCountryName: normalizeNullableText(
      address.legacyCountryName,
      `${path}.legacyCountryName`,
      errors,
      150,
    ),
  };
}

function normalizeCorrespondenceAddress(
  address: CorrespondenceAddressData,
  errors: FieldErrors,
): CorrespondenceAddressData {
  const path = "data.correspondenceAddress";
  return {
    sameAsRegistered: address.sameAsRegistered,
    street: normalizeNullableText(address.street, `${path}.street`, errors, 200),
    houseNumber: normalizeNullableText(address.houseNumber, `${path}.houseNumber`, errors, 50),
    apartmentNumber: normalizeNullableText(
      address.apartmentNumber,
      `${path}.apartmentNumber`,
      errors,
      50,
    ),
    postalCode: normalizeNullableText(address.postalCode, `${path}.postalCode`, errors, 30),
    city: normalizeNullableText(address.city, `${path}.city`, errors, 150),
    countryCode: normalizeCountryCode(address.countryCode, `${path}.countryCode`, errors),
    legacyCountryName: normalizeNullableText(
      address.legacyCountryName,
      `${path}.legacyCountryName`,
      errors,
      150,
    ),
  };
}

function normalizeInstitutions(
  institutions: InstitutionsData,
  errors: FieldErrors,
): InstitutionsData {
  return {
    taxOffice: normalizeReference(
      institutions.taxOffice,
      "data.institutions.taxOffice",
      errors,
    ),
    nfzBranch: normalizeReference(
      institutions.nfzBranch,
      "data.institutions.nfzBranch",
      errors,
    ),
  };
}

function normalizeReference(
  reference: InstitutionReference,
  path: string,
  errors: FieldErrors,
): InstitutionReference {
  if (reference === null) {
    return null;
  }
  const name = normalizeText(reference.name, `${path}.name`, errors, 250);
  return reference.kind === "catalog"
    ? {
      kind: "catalog",
      code: normalizeText(reference.code, `${path}.code`, errors, 20),
      name,
    }
    : { kind: "legacy", code: null, name };
}

function normalizeInsurance(
  insurance: InsuranceData,
  errors: FieldErrors,
): InsuranceData {
  const path = "data.insurance";
  return {
    ...insurance,
    otherEmployerName: normalizeNullableText(
      insurance.otherEmployerName,
      `${path}.otherEmployerName`,
      errors,
      250,
    ),
    schoolOrUniversityName: normalizeNullableText(
      insurance.schoolOrUniversityName,
      `${path}.schoolOrUniversityName`,
      errors,
      250,
    ),
    otherPrincipalName: normalizeNullableText(
      insurance.otherPrincipalName,
      `${path}.otherPrincipalName`,
      errors,
      250,
    ),
    employmentOfficeAddress: normalizeNullableText(
      insurance.employmentOfficeAddress,
      `${path}.employmentOfficeAddress`,
      errors,
      500,
    ),
  };
}

function normalizePayment(
  payment: PaymentData,
  errors: FieldErrors,
): PaymentData {
  let bankAccount = payment.bankAccount;
  if (bankAccount !== "") {
    const normalized = normalizeBankAccount(bankAccount);
    if (normalized === null) {
      errors["data.payment.bankAccount"] = "Bank account is invalid.";
    } else {
      bankAccount = normalized;
    }
  }
  return {
    bankName: normalizeText(payment.bankName, "data.payment.bankName", errors, 200),
    bankAccount,
  };
}

function normalizeCountryCode(
  value: string | null,
  path: string,
  errors: FieldErrors,
): string | null {
  const normalized = normalizeNullableText(value, path, errors)?.toUpperCase() ?? null;
  if (normalized !== null && !isIsoCountryCode(normalized)) {
    errors[path] = "Value must be an ISO 3166-1 alpha-2 country code.";
  }
  return normalized;
}

function normalizeNullableText(
  value: string | null,
  path: string,
  errors: FieldErrors,
  maxLength?: number,
): string | null {
  if (value === null) {
    return null;
  }
  const normalized = normalizeText(value, path, errors, maxLength);
  return normalized === "" ? null : normalized;
}

function normalizeText(
  value: string,
  path: string,
  errors: FieldErrors,
  maxLength?: number,
): string {
  if (containsControlCharacters(value)) {
    errors[path] = "Value must not contain control characters.";
  }
  const normalized = value.trim();
  if (maxLength !== undefined && normalized.length > maxLength) {
    errors[path] = `Value must not exceed ${maxLength} characters.`;
  }
  return normalized;
}
