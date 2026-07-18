import type {
  CorrespondenceAddressData,
  FieldErrors,
  RegisteredAddressData,
} from "./contracts.ts";
import {
  requestBoolean,
  requestNullableString,
  requestObject,
  requestString,
} from "./request-reader.ts";

const REGISTERED_KEYS = [
  "street",
  "houseNumber",
  "apartmentNumber",
  "postalCode",
  "city",
  "voivodeship",
  "county",
  "municipality",
  "postOffice",
  "countryCode",
  "legacyCountryName",
] as const;

const CORRESPONDENCE_KEYS = [
  "sameAsRegistered",
  "street",
  "houseNumber",
  "apartmentNumber",
  "postalCode",
  "city",
  "countryCode",
  "legacyCountryName",
] as const;

export function parseRegisteredAddress(
  value: unknown,
  errors: FieldErrors,
): RegisteredAddressData {
  const source = requestObject(
    value,
    "data.registeredAddress",
    REGISTERED_KEYS,
    [],
    errors,
  );

  return {
    street: requestString(
      source,
      "street",
      "data.registeredAddress.street",
      errors,
    ),
    houseNumber: requestString(
      source,
      "houseNumber",
      "data.registeredAddress.houseNumber",
      errors,
    ),
    apartmentNumber: requestNullableString(
      source,
      "apartmentNumber",
      "data.registeredAddress.apartmentNumber",
      errors,
    ),
    postalCode: requestString(
      source,
      "postalCode",
      "data.registeredAddress.postalCode",
      errors,
    ),
    city: requestString(
      source,
      "city",
      "data.registeredAddress.city",
      errors,
    ),
    voivodeship: requestNullableString(
      source,
      "voivodeship",
      "data.registeredAddress.voivodeship",
      errors,
    ),
    county: requestNullableString(
      source,
      "county",
      "data.registeredAddress.county",
      errors,
    ),
    municipality: requestNullableString(
      source,
      "municipality",
      "data.registeredAddress.municipality",
      errors,
    ),
    postOffice: requestNullableString(
      source,
      "postOffice",
      "data.registeredAddress.postOffice",
      errors,
    ),
    countryCode: requestNullableString(
      source,
      "countryCode",
      "data.registeredAddress.countryCode",
      errors,
    ),
    legacyCountryName: requestNullableString(
      source,
      "legacyCountryName",
      "data.registeredAddress.legacyCountryName",
      errors,
    ),
  };
}

export function parseCorrespondenceAddress(
  value: unknown,
  errors: FieldErrors,
): CorrespondenceAddressData {
  const source = requestObject(
    value,
    "data.correspondenceAddress",
    CORRESPONDENCE_KEYS,
    [],
    errors,
  );

  return {
    sameAsRegistered: requestBoolean(
      source,
      "sameAsRegistered",
      "data.correspondenceAddress.sameAsRegistered",
      errors,
    ),
    street: requestNullableString(
      source,
      "street",
      "data.correspondenceAddress.street",
      errors,
    ),
    houseNumber: requestNullableString(
      source,
      "houseNumber",
      "data.correspondenceAddress.houseNumber",
      errors,
    ),
    apartmentNumber: requestNullableString(
      source,
      "apartmentNumber",
      "data.correspondenceAddress.apartmentNumber",
      errors,
    ),
    postalCode: requestNullableString(
      source,
      "postalCode",
      "data.correspondenceAddress.postalCode",
      errors,
    ),
    city: requestNullableString(
      source,
      "city",
      "data.correspondenceAddress.city",
      errors,
    ),
    countryCode: requestNullableString(
      source,
      "countryCode",
      "data.correspondenceAddress.countryCode",
      errors,
    ),
    legacyCountryName: requestNullableString(
      source,
      "legacyCountryName",
      "data.correspondenceAddress.legacyCountryName",
      errors,
    ),
  };
}
