export type YesNo = "yes" | "no";

export interface PersonalData {
  firstName: string;
  lastName: string;
  maidenName: string | null;
  middleName: string | null;
  birthDate: string;
  birthPlace: string;
  identificationBasis: "pesel" | "identity_document";
  pesel: string | null;
  nip: string | null;
  identityDocumentKind: "id_card" | "passport" | "other" | null;
  identityDocumentNumber: string | null;
  citizenship: string;
  phone: string;
}

export interface AddressData {
  street: string;
  houseNumber: string;
  apartmentNumber: string | null;
  postalCode: string;
  city: string;
  country: string;
}

export interface CorrespondenceAddressData {
  sameAsRegistered: boolean;
  street: string | null;
  houseNumber: string | null;
  apartmentNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

export interface InstitutionsData {
  taxOffice: string;
  nfzBranch: string;
}

export interface InsuranceData {
  otherEmployment: YesNo;
  otherEmploymentAtLeastMinimumWage: YesNo | "not_applicable";
  studentUnder26: YesNo;
  otherMandateContract: YesNo;
  otherMandateContractSocialInsurance: YesNo | "not_applicable";
  subjectToCompulsorySocialInsurance: YesNo;
  voluntarySicknessInsurance: "join" | "decline";
  voluntarySicknessInsuranceJoinConfirmed: boolean;
  pensionDisabilityInsurance: YesNo | "not_applicable";
  disabilityDegree: "none" | "light" | "moderate" | "severe";
  registeredAtEmploymentOffice: YesNo;
}

export interface PaymentData {
  bankName: string;
  bankAccount: string;
}

export interface QuestionnairePayload {
  personal: PersonalData;
  registeredAddress: AddressData;
  correspondenceAddress: CorrespondenceAddressData;
  institutions: InstitutionsData;
  insurance: InsuranceData;
  payment: PaymentData;
}

export type QuestionnairePayloadWithoutSensitiveValues =
  & Omit<
    QuestionnairePayload,
    "personal" | "payment"
  >
  & {
    personal: Omit<PersonalData, "pesel" | "identityDocumentNumber"> & {
      pesel: string;
      identityDocumentNumber: string;
    };
    payment: Omit<PaymentData, "bankAccount"> & {
      bankAccount: string;
    };
  };

export interface SensitiveFieldMetadata {
  configured: boolean;
  masked: string | null;
}

export interface SensitiveMetadata {
  pesel: SensitiveFieldMetadata;
  identityDocumentNumber: SensitiveFieldMetadata;
  bankAccount: SensitiveFieldMetadata;
}

export interface SensitivePreservation {
  pesel: boolean;
  identityDocumentNumber: boolean;
  bankAccount: boolean;
}

export interface ParsedQuestionnairePutRequest {
  data: QuestionnairePayload;
  complete: boolean;
  preserveSensitive: SensitivePreservation;
}

export interface SensitiveLast4 {
  peselLast4: string | null;
  identityDocumentLast4: string | null;
  bankAccountLast4: string | null;
}

export class QuestionnaireValidationError extends Error {
  constructor(readonly fieldErrors: { [field: string]: string }) {
    super("Questionnaire validation failed.");
    this.name = "QuestionnaireValidationError";
  }
}

type UnknownObject = { [key: string]: unknown };
type FieldErrors = { [field: string]: string };

const DATA_KEYS = [
  "personal",
  "registeredAddress",
  "correspondenceAddress",
  "institutions",
  "insurance",
  "payment",
] as const;

const PERSONAL_KEYS = [
  "firstName",
  "lastName",
  "maidenName",
  "middleName",
  "birthDate",
  "birthPlace",
  "identificationBasis",
  "pesel",
  "nip",
  "identityDocumentKind",
  "identityDocumentNumber",
  "citizenship",
  "phone",
] as const;

const ADDRESS_KEYS = [
  "street",
  "houseNumber",
  "apartmentNumber",
  "postalCode",
  "city",
  "country",
] as const;

const CORRESPONDENCE_ADDRESS_KEYS = [
  "sameAsRegistered",
  "street",
  "houseNumber",
  "apartmentNumber",
  "postalCode",
  "city",
  "country",
] as const;

const INSTITUTIONS_KEYS = ["taxOffice", "nfzBranch"] as const;

const INSURANCE_KEYS = [
  "otherEmployment",
  "otherEmploymentAtLeastMinimumWage",
  "studentUnder26",
  "otherMandateContract",
  "otherMandateContractSocialInsurance",
  "subjectToCompulsorySocialInsurance",
  "voluntarySicknessInsurance",
  "voluntarySicknessInsuranceJoinConfirmed",
  "pensionDisabilityInsurance",
  "disabilityDegree",
  "registeredAtEmploymentOffice",
] as const;

const PAYMENT_KEYS = ["bankName", "bankAccount"] as const;
const YES_NO_VALUES = ["yes", "no"] as const;
const YES_NO_NOT_APPLICABLE_VALUES = ["yes", "no", "not_applicable"] as const;
const DOCUMENT_KINDS = ["id_card", "passport", "other"] as const;
const IDENTIFICATION_BASES = ["pesel", "identity_document"] as const;
const SICKNESS_INSURANCE_CHOICES = ["join", "decline"] as const;
const DISABILITY_DEGREES = ["none", "light", "moderate", "severe"] as const;

export function parseQuestionnairePutRequest(
  value: unknown,
): ParsedQuestionnairePutRequest {
  const errors: FieldErrors = {};
  const request = readObject(value, "", ["data", "complete"], [], errors);
  const parsedData = parseQuestionnaireData(request.data, true, errors);
  const complete = readBoolean(request, "complete", "complete", errors);

  throwIfInvalid(errors);

  return {
    data: parsedData.data,
    complete,
    preserveSensitive: parsedData.preserveSensitive,
  };
}

export function parseStoredQuestionnairePayload(
  value: unknown,
): QuestionnairePayload {
  const errors: FieldErrors = {};
  const parsed = parseQuestionnaireData(value, false, errors);

  throwIfInvalid(errors);
  return parsed.data;
}

export function mergeSensitiveValues(
  incoming: QuestionnairePayload,
  preserve: SensitivePreservation,
  existing: QuestionnairePayload | null,
): QuestionnairePayload {
  return {
    ...incoming,
    personal: {
      ...incoming.personal,
      pesel: preserve.pesel
        ? (existing?.personal.pesel ?? null)
        : incoming.personal.pesel,
      identityDocumentNumber: preserve.identityDocumentNumber
        ? (existing?.personal.identityDocumentNumber ?? null)
        : incoming.personal.identityDocumentNumber,
    },
    payment: {
      ...incoming.payment,
      bankAccount: preserve.bankAccount
        ? (existing?.payment.bankAccount ?? "")
        : incoming.payment.bankAccount,
    },
  };
}

export function validateQuestionnairePayload(
  payload: QuestionnairePayload,
  complete: boolean,
): QuestionnairePayload {
  const errors: FieldErrors = {};
  const birthDate = payload.personal.birthDate;
  const hasValidBirthDate = birthDate !== "" && isValidIsoDate(birthDate);

  if (birthDate !== "" && !hasValidBirthDate) {
    errors["data.personal.birthDate"] =
      "Date must use a valid YYYY-MM-DD value.";
  }

  let pesel = payload.personal.pesel;
  if (pesel !== null) {
    pesel = normalizePesel(pesel);

    if (pesel === "") {
      errors["data.personal.pesel"] = "PESEL is invalid.";
      pesel = null;
    } else {
      const peselBirthDate = getPeselBirthDate(pesel);
      if (peselBirthDate === null) {
        errors["data.personal.pesel"] = "PESEL is invalid.";
      } else if (hasValidBirthDate && birthDate !== peselBirthDate) {
        errors["data.personal.birthDate"] = "Birth date must match PESEL.";
      }
    }
  }

  const nip = payload.personal.nip;
  if (nip !== null && !isValidNip(nip)) {
    errors["data.personal.nip"] = "NIP is invalid.";
  }

  let identityDocumentNumber = payload.personal.identityDocumentNumber;
  if (identityDocumentNumber !== null) {
    if (containsControlCharacters(identityDocumentNumber)) {
      errors["data.personal.identityDocumentNumber"] =
        "Document number must not contain control characters.";
    }

    identityDocumentNumber = identityDocumentNumber.trim().toUpperCase();
    if (identityDocumentNumber === "") {
      errors["data.personal.identityDocumentNumber"] =
        "Document number must contain between 3 and 32 characters.";
      identityDocumentNumber = null;
    } else if (
      identityDocumentNumber.length < 3 ||
      identityDocumentNumber.length > 32
    ) {
      errors["data.personal.identityDocumentNumber"] =
        "Document number must contain between 3 and 32 characters.";
    }
  }

  let bankAccount = payload.payment.bankAccount;
  if (bankAccount !== "") {
    const normalizedBankAccount = normalizeBankAccount(bankAccount);
    if (normalizedBankAccount === null) {
      errors["data.payment.bankAccount"] = "Bank account is invalid.";
    } else {
      bankAccount = normalizedBankAccount;
    }
  }

  const normalized: QuestionnairePayload = {
    ...payload,
    personal: {
      ...payload.personal,
      pesel,
      identityDocumentNumber,
    },
    payment: {
      ...payload.payment,
      bankAccount,
    },
  };

  if (complete) {
    validateCompleteQuestionnaire(normalized, errors);
  }

  throwIfInvalid(errors);
  return normalized;
}

export function isSicknessInsuranceChoiceConfirmed(
  payload: QuestionnairePayload,
): boolean {
  return (
    payload.insurance.voluntarySicknessInsurance === "decline" ||
    payload.insurance.voluntarySicknessInsuranceJoinConfirmed
  );
}

export function buildSensitiveMetadata(
  payload: QuestionnairePayload,
): SensitiveMetadata {
  const last4 = getSensitiveLast4(payload);

  return {
    pesel: buildSensitiveField(last4.peselLast4, "*******"),
    identityDocumentNumber: buildSensitiveField(
      last4.identityDocumentLast4,
      "••••",
    ),
    bankAccount: buildSensitiveField(last4.bankAccountLast4, "••••"),
  };
}

export function getSensitiveLast4(
  payload: QuestionnairePayload,
): SensitiveLast4 {
  return {
    peselLast4: payload.personal.pesel?.slice(-4) ?? null,
    identityDocumentLast4: payload.personal.identityDocumentNumber?.slice(-4) ??
      null,
    bankAccountLast4: payload.payment.bankAccount.slice(-4) || null,
  };
}

export function redactSensitiveValues(
  payload: QuestionnairePayload,
): QuestionnairePayloadWithoutSensitiveValues {
  return {
    ...payload,
    personal: {
      ...payload.personal,
      pesel: "",
      identityDocumentNumber: "",
    },
    payment: {
      ...payload.payment,
      bankAccount: "",
    },
  };
}

function parseQuestionnaireData(
  value: unknown,
  allowSensitiveOmission: boolean,
  errors: FieldErrors,
): {
  data: QuestionnairePayload;
  preserveSensitive: SensitivePreservation;
} {
  const data = readObject(value, "data", DATA_KEYS, [], errors);
  const personal = readObject(
    data.personal,
    "data.personal",
    PERSONAL_KEYS,
    allowSensitiveOmission ? ["pesel", "identityDocumentNumber"] : [],
    errors,
  );
  const registeredAddress = readObject(
    data.registeredAddress,
    "data.registeredAddress",
    ADDRESS_KEYS,
    [],
    errors,
  );
  const correspondenceAddress = readObject(
    data.correspondenceAddress,
    "data.correspondenceAddress",
    CORRESPONDENCE_ADDRESS_KEYS,
    [],
    errors,
  );
  const institutions = readObject(
    data.institutions,
    "data.institutions",
    INSTITUTIONS_KEYS,
    [],
    errors,
  );
  const insurance = readObject(
    data.insurance,
    "data.insurance",
    INSURANCE_KEYS,
    [],
    errors,
  );
  const payment = readObject(
    data.payment,
    "data.payment",
    PAYMENT_KEYS,
    allowSensitiveOmission ? ["bankAccount"] : [],
    errors,
  );

  const peselInput = readOptionalNullableString(
    personal,
    "pesel",
    "data.personal.pesel",
    errors,
  );
  const documentInput = readOptionalNullableString(
    personal,
    "identityDocumentNumber",
    "data.personal.identityDocumentNumber",
    errors,
  );
  const bankAccountInput = readOptionalString(
    payment,
    "bankAccount",
    "data.payment.bankAccount",
    errors,
  );

  const preservePesel = peselInput.missing ||
    peselInput.value === null ||
    peselInput.value === "";
  const preserveDocument = documentInput.missing ||
    documentInput.value === null ||
    documentInput.value === "";
  const preserveBankAccount = bankAccountInput.missing ||
    bankAccountInput.value === "";

  return {
    data: {
      personal: {
        firstName: readString(
          personal,
          "firstName",
          "data.personal.firstName",
          errors,
        ),
        lastName: readString(
          personal,
          "lastName",
          "data.personal.lastName",
          errors,
        ),
        maidenName: readNullableString(
          personal,
          "maidenName",
          "data.personal.maidenName",
          errors,
        ),
        middleName: readNullableString(
          personal,
          "middleName",
          "data.personal.middleName",
          errors,
        ),
        birthDate: readString(
          personal,
          "birthDate",
          "data.personal.birthDate",
          errors,
        ),
        birthPlace: readString(
          personal,
          "birthPlace",
          "data.personal.birthPlace",
          errors,
        ),
        identificationBasis: readEnum(
          personal,
          "identificationBasis",
          "data.personal.identificationBasis",
          IDENTIFICATION_BASES,
          errors,
        ),
        pesel: preservePesel ? null : peselInput.value,
        nip: readNullableString(personal, "nip", "data.personal.nip", errors),
        identityDocumentKind: readNullableEnum(
          personal,
          "identityDocumentKind",
          "data.personal.identityDocumentKind",
          DOCUMENT_KINDS,
          errors,
        ),
        identityDocumentNumber: preserveDocument ? null : documentInput.value,
        citizenship: readString(
          personal,
          "citizenship",
          "data.personal.citizenship",
          errors,
        ),
        phone: readString(personal, "phone", "data.personal.phone", errors),
      },
      registeredAddress: {
        street: readString(
          registeredAddress,
          "street",
          "data.registeredAddress.street",
          errors,
        ),
        houseNumber: readString(
          registeredAddress,
          "houseNumber",
          "data.registeredAddress.houseNumber",
          errors,
        ),
        apartmentNumber: readNullableString(
          registeredAddress,
          "apartmentNumber",
          "data.registeredAddress.apartmentNumber",
          errors,
        ),
        postalCode: readString(
          registeredAddress,
          "postalCode",
          "data.registeredAddress.postalCode",
          errors,
        ),
        city: readString(
          registeredAddress,
          "city",
          "data.registeredAddress.city",
          errors,
        ),
        country: readString(
          registeredAddress,
          "country",
          "data.registeredAddress.country",
          errors,
        ),
      },
      correspondenceAddress: {
        sameAsRegistered: readBoolean(
          correspondenceAddress,
          "sameAsRegistered",
          "data.correspondenceAddress.sameAsRegistered",
          errors,
        ),
        street: readNullableString(
          correspondenceAddress,
          "street",
          "data.correspondenceAddress.street",
          errors,
        ),
        houseNumber: readNullableString(
          correspondenceAddress,
          "houseNumber",
          "data.correspondenceAddress.houseNumber",
          errors,
        ),
        apartmentNumber: readNullableString(
          correspondenceAddress,
          "apartmentNumber",
          "data.correspondenceAddress.apartmentNumber",
          errors,
        ),
        postalCode: readNullableString(
          correspondenceAddress,
          "postalCode",
          "data.correspondenceAddress.postalCode",
          errors,
        ),
        city: readNullableString(
          correspondenceAddress,
          "city",
          "data.correspondenceAddress.city",
          errors,
        ),
        country: readNullableString(
          correspondenceAddress,
          "country",
          "data.correspondenceAddress.country",
          errors,
        ),
      },
      institutions: {
        taxOffice: readString(
          institutions,
          "taxOffice",
          "data.institutions.taxOffice",
          errors,
        ),
        nfzBranch: readString(
          institutions,
          "nfzBranch",
          "data.institutions.nfzBranch",
          errors,
        ),
      },
      insurance: {
        otherEmployment: readEnum(
          insurance,
          "otherEmployment",
          "data.insurance.otherEmployment",
          YES_NO_VALUES,
          errors,
        ),
        otherEmploymentAtLeastMinimumWage: readEnum(
          insurance,
          "otherEmploymentAtLeastMinimumWage",
          "data.insurance.otherEmploymentAtLeastMinimumWage",
          YES_NO_NOT_APPLICABLE_VALUES,
          errors,
        ),
        studentUnder26: readEnum(
          insurance,
          "studentUnder26",
          "data.insurance.studentUnder26",
          YES_NO_VALUES,
          errors,
        ),
        otherMandateContract: readEnum(
          insurance,
          "otherMandateContract",
          "data.insurance.otherMandateContract",
          YES_NO_VALUES,
          errors,
        ),
        otherMandateContractSocialInsurance: readEnum(
          insurance,
          "otherMandateContractSocialInsurance",
          "data.insurance.otherMandateContractSocialInsurance",
          YES_NO_NOT_APPLICABLE_VALUES,
          errors,
        ),
        subjectToCompulsorySocialInsurance: readEnum(
          insurance,
          "subjectToCompulsorySocialInsurance",
          "data.insurance.subjectToCompulsorySocialInsurance",
          YES_NO_VALUES,
          errors,
        ),
        voluntarySicknessInsurance: readEnum(
          insurance,
          "voluntarySicknessInsurance",
          "data.insurance.voluntarySicknessInsurance",
          SICKNESS_INSURANCE_CHOICES,
          errors,
        ),
        voluntarySicknessInsuranceJoinConfirmed: readBoolean(
          insurance,
          "voluntarySicknessInsuranceJoinConfirmed",
          "data.insurance.voluntarySicknessInsuranceJoinConfirmed",
          errors,
        ),
        pensionDisabilityInsurance: readEnum(
          insurance,
          "pensionDisabilityInsurance",
          "data.insurance.pensionDisabilityInsurance",
          YES_NO_NOT_APPLICABLE_VALUES,
          errors,
        ),
        disabilityDegree: readEnum(
          insurance,
          "disabilityDegree",
          "data.insurance.disabilityDegree",
          DISABILITY_DEGREES,
          errors,
        ),
        registeredAtEmploymentOffice: readEnum(
          insurance,
          "registeredAtEmploymentOffice",
          "data.insurance.registeredAtEmploymentOffice",
          YES_NO_VALUES,
          errors,
        ),
      },
      payment: {
        bankName: readString(
          payment,
          "bankName",
          "data.payment.bankName",
          errors,
        ),
        bankAccount: preserveBankAccount ? "" : bankAccountInput.value,
      },
    },
    preserveSensitive: {
      pesel: preservePesel,
      identityDocumentNumber: preserveDocument,
      bankAccount: preserveBankAccount,
    },
  };
}

function validateCompleteQuestionnaire(
  payload: QuestionnairePayload,
  errors: FieldErrors,
): void {
  requireNonBlank(
    payload.personal.firstName,
    "data.personal.firstName",
    errors,
  );
  requireNonBlank(payload.personal.lastName, "data.personal.lastName", errors);
  requireNonBlank(
    payload.personal.birthDate,
    "data.personal.birthDate",
    errors,
  );
  requireNonBlank(
    payload.personal.birthPlace,
    "data.personal.birthPlace",
    errors,
  );
  requireNonBlank(
    payload.personal.citizenship,
    "data.personal.citizenship",
    errors,
  );
  requireNonBlank(payload.personal.phone, "data.personal.phone", errors);

  requireNonBlank(
    payload.registeredAddress.street,
    "data.registeredAddress.street",
    errors,
  );
  requireNonBlank(
    payload.registeredAddress.houseNumber,
    "data.registeredAddress.houseNumber",
    errors,
  );
  requireNonBlank(
    payload.registeredAddress.postalCode,
    "data.registeredAddress.postalCode",
    errors,
  );
  requireNonBlank(
    payload.registeredAddress.city,
    "data.registeredAddress.city",
    errors,
  );
  requireNonBlank(
    payload.registeredAddress.country,
    "data.registeredAddress.country",
    errors,
  );

  if (!payload.correspondenceAddress.sameAsRegistered) {
    requireNonBlank(
      payload.correspondenceAddress.street,
      "data.correspondenceAddress.street",
      errors,
    );
    requireNonBlank(
      payload.correspondenceAddress.houseNumber,
      "data.correspondenceAddress.houseNumber",
      errors,
    );
    requireNonBlank(
      payload.correspondenceAddress.postalCode,
      "data.correspondenceAddress.postalCode",
      errors,
    );
    requireNonBlank(
      payload.correspondenceAddress.city,
      "data.correspondenceAddress.city",
      errors,
    );
    requireNonBlank(
      payload.correspondenceAddress.country,
      "data.correspondenceAddress.country",
      errors,
    );
  }

  requireNonBlank(
    payload.institutions.taxOffice,
    "data.institutions.taxOffice",
    errors,
  );
  requireNonBlank(
    payload.institutions.nfzBranch,
    "data.institutions.nfzBranch",
    errors,
  );

  if (payload.personal.identificationBasis === "pesel") {
    if (payload.personal.pesel === null) {
      errors["data.personal.pesel"] = "PESEL is required.";
    }
  } else {
    if (payload.personal.identityDocumentKind === null) {
      errors["data.personal.identityDocumentKind"] =
        "Document kind is required.";
    }
    if (payload.personal.identityDocumentNumber === null) {
      errors["data.personal.identityDocumentNumber"] =
        "Document number is required.";
    }
  }

  if (payload.insurance.otherEmployment === "no") {
    requireValue(
      payload.insurance.otherEmploymentAtLeastMinimumWage,
      "not_applicable",
      "data.insurance.otherEmploymentAtLeastMinimumWage",
      errors,
    );
  } else if (
    payload.insurance.otherEmploymentAtLeastMinimumWage === "not_applicable"
  ) {
    errors["data.insurance.otherEmploymentAtLeastMinimumWage"] =
      "A yes or no answer is required.";
  }

  if (payload.insurance.otherMandateContract === "no") {
    requireValue(
      payload.insurance.otherMandateContractSocialInsurance,
      "not_applicable",
      "data.insurance.otherMandateContractSocialInsurance",
      errors,
    );
  } else if (
    payload.insurance.otherMandateContractSocialInsurance === "not_applicable"
  ) {
    errors["data.insurance.otherMandateContractSocialInsurance"] =
      "A yes or no answer is required.";
  }

  if (
    payload.insurance.voluntarySicknessInsurance === "join" &&
    !payload.insurance.voluntarySicknessInsuranceJoinConfirmed
  ) {
    errors["data.insurance.voluntarySicknessInsuranceJoinConfirmed"] =
      "Joining sickness insurance must be confirmed.";
  }

  requireNonBlank(payload.payment.bankName, "data.payment.bankName", errors);
  requireNonBlank(
    payload.payment.bankAccount,
    "data.payment.bankAccount",
    errors,
  );
}

function readObject(
  value: unknown,
  path: string,
  expectedKeys: readonly string[],
  optionalKeys: readonly string[],
  errors: FieldErrors,
): UnknownObject {
  if (!isObject(value)) {
    errors[path || "request"] = "Value must be an object.";
    return {};
  }

  for (const key of expectedKeys) {
    if (!optionalKeys.includes(key) && !hasOwn(value, key)) {
      errors[joinPath(path, key)] = "Field is required.";
    }
  }

  for (const key of Object.keys(value)) {
    if (!expectedKeys.includes(key)) {
      errors[joinPath(path, key)] = "Unexpected field.";
    }
  }

  return value;
}

function readString(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): string {
  const value = source[key];
  if (typeof value !== "string") {
    errors[path] = "Value must be a string.";
    return "";
  }
  return value;
}

function readNullableString(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): string | null {
  const value = source[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    errors[path] = "Value must be a string or null.";
    return null;
  }
  return value;
}

function readOptionalString(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): { value: string; missing: boolean } {
  if (!hasOwn(source, key)) {
    return { value: "", missing: true };
  }

  return {
    value: readString(source, key, path, errors),
    missing: false,
  };
}

function readOptionalNullableString(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): { value: string | null; missing: boolean } {
  if (!hasOwn(source, key)) {
    return { value: null, missing: true };
  }

  return {
    value: readNullableString(source, key, path, errors),
    missing: false,
  };
}

function readBoolean(
  source: UnknownObject,
  key: string,
  path: string,
  errors: FieldErrors,
): boolean {
  const value = source[key];
  if (typeof value !== "boolean") {
    errors[path] = "Value must be a boolean.";
    return false;
  }
  return value;
}

function readEnum<const TValue extends string>(
  source: UnknownObject,
  key: string,
  path: string,
  allowedValues: readonly TValue[],
  errors: FieldErrors,
): TValue {
  const value = source[key];
  if (typeof value !== "string" || !allowedValues.includes(value as TValue)) {
    errors[path] = "Value is not allowed.";
    return allowedValues[0];
  }
  return value as TValue;
}

function readNullableEnum<const TValue extends string>(
  source: UnknownObject,
  key: string,
  path: string,
  allowedValues: readonly TValue[],
  errors: FieldErrors,
): TValue | null {
  if (source[key] === null) {
    return null;
  }
  return readEnum(source, key, path, allowedValues, errors);
}

function throwIfInvalid(errors: FieldErrors): void {
  if (Object.keys(errors).length > 0) {
    throw new QuestionnaireValidationError(errors);
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

function requireValue(
  value: string,
  expected: string,
  path: string,
  errors: FieldErrors,
): void {
  if (value !== expected) {
    errors[path] = `Value must be ${expected}.`;
  }
}

function normalizePesel(value: string): string {
  return value.replace(/[ -]/g, "");
}

function getPeselBirthDate(pesel: string): string | null {
  if (!/^\d{11}$/.test(pesel)) {
    return null;
  }

  const digits = [...pesel].map(Number);
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  const checksum = (10 -
    weights.reduce((sum, weight, index) => sum + weight * digits[index], 0) %
      10) %
    10;

  if (checksum !== digits[10]) {
    return null;
  }

  const yearPart = Number(pesel.slice(0, 2));
  const encodedMonth = Number(pesel.slice(2, 4));
  const day = Number(pesel.slice(4, 6));
  let century: number;
  let month: number;

  if (encodedMonth >= 1 && encodedMonth <= 12) {
    century = 1900;
    month = encodedMonth;
  } else if (encodedMonth >= 21 && encodedMonth <= 32) {
    century = 2000;
    month = encodedMonth - 20;
  } else if (encodedMonth >= 41 && encodedMonth <= 52) {
    century = 2100;
    month = encodedMonth - 40;
  } else if (encodedMonth >= 61 && encodedMonth <= 72) {
    century = 2200;
    month = encodedMonth - 60;
  } else if (encodedMonth >= 81 && encodedMonth <= 92) {
    century = 1800;
    month = encodedMonth - 80;
  } else {
    return null;
  }

  const year = century + yearPart;
  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${
    String(
      day,
    ).padStart(2, "0")
  }`;
}

function isValidIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }

  return isValidDateParts(Number(match[1]), Number(match[2]), Number(match[3]));
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function isValidNip(nip: string): boolean {
  if (!/^\d{10}$/.test(nip)) {
    return false;
  }

  const digits = [...nip].map(Number);
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const checksum = weights.reduce(
    (sum, weight, index) => sum + weight * digits[index],
    0,
  ) % 11;

  return checksum !== 10 && checksum === digits[9];
}

function normalizeBankAccountInput(value: string): string {
  return value.toUpperCase().replace(/[ -]/g, "");
}

function normalizeBankAccount(value: string): string | null {
  const input = normalizeBankAccountInput(value);
  const canonical = /^\d{26}$/.test(input) ? `PL${input}` : input;

  if (!/^PL\d{26}$/.test(canonical)) {
    return null;
  }

  const rearranged = `${canonical.slice(4)}2521${canonical.slice(2, 4)}`;
  let remainder = 0;
  for (const digit of rearranged) {
    remainder = (remainder * 10 + Number(digit)) % 97;
  }

  return remainder === 1 ? canonical : null;
}

function buildSensitiveField(
  last4: string | null,
  maskPrefix: string,
): SensitiveFieldMetadata {
  return {
    configured: last4 !== null,
    masked: last4 === null ? null : `${maskPrefix}${last4}`,
  };
}

function containsControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return true;
    }
  }
  return false;
}

function isObject(value: unknown): value is UnknownObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(source: UnknownObject, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function joinPath(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}
