import type {
  FieldErrors,
  PersonalData,
  SensitivePreservation,
} from "./contracts.ts";
import {
  requestNullableEnum,
  requestNullableString,
  requestObject,
  requestOptionalNullableString,
  requestString,
} from "./request-reader.ts";

const KEYS = [
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

const IDENTIFICATION_BASES = ["pesel", "identity_document"] as const;
const DOCUMENT_KINDS = ["id_card", "passport", "other"] as const;

export function parsePersonal(
  value: unknown,
  allowSensitiveOmission: boolean,
  errors: FieldErrors,
): {
  data: PersonalData;
  preserve: Pick<
    SensitivePreservation,
    "pesel" | "identityDocumentNumber"
  >;
} {
  const source = requestObject(
    value,
    "data.personal",
    KEYS,
    allowSensitiveOmission ? ["pesel", "identityDocumentNumber"] : [],
    errors,
  );
  const pesel = requestOptionalNullableString(
    source,
    "pesel",
    "data.personal.pesel",
    errors,
  );
  const documentNumber = requestOptionalNullableString(
    source,
    "identityDocumentNumber",
    "data.personal.identityDocumentNumber",
    errors,
  );
  const preservePesel = allowSensitiveOmission &&
    (pesel.missing || pesel.value === null || pesel.value.trim() === "");
  const preserveDocument = allowSensitiveOmission &&
    (documentNumber.missing ||
      documentNumber.value === null ||
      documentNumber.value.trim() === "");

  return {
    data: {
      firstName: requestString(source, "firstName", "data.personal.firstName", errors),
      lastName: requestString(source, "lastName", "data.personal.lastName", errors),
      maidenName: requestNullableString(source, "maidenName", "data.personal.maidenName", errors),
      middleName: requestNullableString(source, "middleName", "data.personal.middleName", errors),
      birthDate: requestString(source, "birthDate", "data.personal.birthDate", errors),
      birthPlace: requestString(source, "birthPlace", "data.personal.birthPlace", errors),
      identificationBasis: requestNullableEnum(
        source,
        "identificationBasis",
        "data.personal.identificationBasis",
        IDENTIFICATION_BASES,
        errors,
      ),
      pesel: preservePesel ? null : pesel.value,
      nip: requestNullableString(source, "nip", "data.personal.nip", errors),
      identityDocumentKind: requestNullableEnum(
        source,
        "identityDocumentKind",
        "data.personal.identityDocumentKind",
        DOCUMENT_KINDS,
        errors,
      ),
      identityDocumentNumber: preserveDocument ? null : documentNumber.value,
      citizenship: requestString(source, "citizenship", "data.personal.citizenship", errors),
      phone: requestString(source, "phone", "data.personal.phone", errors),
    },
    preserve: {
      pesel: preservePesel,
      identityDocumentNumber: preserveDocument,
    },
  };
}
