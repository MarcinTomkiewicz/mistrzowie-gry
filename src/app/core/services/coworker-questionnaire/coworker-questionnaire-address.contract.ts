import {
  ICoworkerCorrespondenceAddressData,
  ICoworkerQuestionnaireAddressData,
} from '../../interfaces/i-coworker-questionnaire';
import { COUNTRY_CODE_CATALOG } from '../../configs/reference-catalogs/country-codes.config';
import {
  readEdgeBoolean,
  readEdgeNullableLiteral,
  readEdgeNullableString,
  readEdgeObject,
  readEdgeString,
} from '../../utils/edge-contract';

export function parseRegisteredAddress(
  value: unknown,
): ICoworkerQuestionnaireAddressData {
  const path = 'data.registeredAddress';
  const address = readEdgeObject(value, path);

  return {
    street: readEdgeString(address['street'], `${path}.street`),
    houseNumber: readEdgeString(address['houseNumber'], `${path}.houseNumber`),
    apartmentNumber: readEdgeNullableString(
      address['apartmentNumber'],
      `${path}.apartmentNumber`,
    ),
    postalCode: readEdgeString(address['postalCode'], `${path}.postalCode`),
    city: readEdgeString(address['city'], `${path}.city`),
    voivodeship: readEdgeNullableString(
      address['voivodeship'],
      `${path}.voivodeship`,
    ),
    county: readEdgeNullableString(address['county'], `${path}.county`),
    municipality: readEdgeNullableString(
      address['municipality'],
      `${path}.municipality`,
    ),
    postOffice: readEdgeNullableString(
      address['postOffice'],
      `${path}.postOffice`,
    ),
    countryCode: readEdgeNullableLiteral(
      address['countryCode'],
      `${path}.countryCode`,
      COUNTRY_CODE_CATALOG.codes,
    ),
    legacyCountryName: readEdgeNullableString(
      address['legacyCountryName'],
      `${path}.legacyCountryName`,
    ),
  };
}

export function parseCorrespondenceAddress(
  value: unknown,
): ICoworkerCorrespondenceAddressData {
  const path = 'data.correspondenceAddress';
  const address = readEdgeObject(value, path);

  return {
    sameAsRegistered: readEdgeBoolean(
      address['sameAsRegistered'],
      `${path}.sameAsRegistered`,
    ),
    street: readEdgeNullableString(address['street'], `${path}.street`),
    houseNumber: readEdgeNullableString(
      address['houseNumber'],
      `${path}.houseNumber`,
    ),
    apartmentNumber: readEdgeNullableString(
      address['apartmentNumber'],
      `${path}.apartmentNumber`,
    ),
    postalCode: readEdgeNullableString(
      address['postalCode'],
      `${path}.postalCode`,
    ),
    city: readEdgeNullableString(address['city'], `${path}.city`),
    countryCode: readEdgeNullableLiteral(
      address['countryCode'],
      `${path}.countryCode`,
      COUNTRY_CODE_CATALOG.codes,
    ),
    legacyCountryName: readEdgeNullableString(
      address['legacyCountryName'],
      `${path}.legacyCountryName`,
    ),
  };
}
