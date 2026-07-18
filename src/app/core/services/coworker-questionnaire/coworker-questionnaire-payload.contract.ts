import type {
  ICoworkerQuestionnaireInstitutionsData,
  ICoworkerQuestionnaireReadPaymentData,
  ICoworkerQuestionnaireReadPayload,
} from '../../interfaces/i-coworker-questionnaire';
import type {
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireInstitutionReference,
} from '../../types/coworker-questionnaire';
import {
  assertEdgeContract,
  readEdgeLiteral,
  readEdgeNullableLiteral,
  readEdgeNullableString,
  readEdgeObject,
  readEdgeString,
} from '../../utils/edge-contract';
import {
  parseCorrespondenceAddress,
  parseRegisteredAddress,
} from './coworker-questionnaire-address.contract';
import { parseQuestionnaireInsurance } from './coworker-questionnaire-insurance.contract';

const IDENTIFICATION_BASIS_VALUES: readonly Exclude<
  QuestionnaireIdentificationBasis,
  null
>[] = ['pesel', 'identity_document'];
const IDENTITY_DOCUMENT_KIND_VALUES: readonly Exclude<
  QuestionnaireIdentityDocumentKind,
  null
>[] = ['id_card', 'passport', 'other'];

export function parseCoworkerQuestionnaireReadPayload(
  value: unknown,
): ICoworkerQuestionnaireReadPayload {
  const data = readEdgeObject(value, 'data');

  return {
    personal: parsePersonal(data['personal']),
    registeredAddress: parseRegisteredAddress(data['registeredAddress']),
    correspondenceAddress: parseCorrespondenceAddress(
      data['correspondenceAddress'],
    ),
    institutions: parseInstitutions(data['institutions']),
    insurance: parseQuestionnaireInsurance(data['insurance']),
    payment: parsePayment(data['payment']),
  };
}

function parsePersonal(
  value: unknown,
): ICoworkerQuestionnaireReadPayload['personal'] {
  const path = 'data.personal';
  const personal = readEdgeObject(value, path);

  return {
    firstName: readEdgeString(personal['firstName'], `${path}.firstName`),
    lastName: readEdgeString(personal['lastName'], `${path}.lastName`),
    maidenName: readEdgeNullableString(
      personal['maidenName'],
      `${path}.maidenName`,
    ),
    middleName: readEdgeNullableString(
      personal['middleName'],
      `${path}.middleName`,
    ),
    birthDate: readEdgeString(personal['birthDate'], `${path}.birthDate`),
    birthPlace: readEdgeString(personal['birthPlace'], `${path}.birthPlace`),
    identificationBasis: readEdgeNullableLiteral(
      personal['identificationBasis'],
      `${path}.identificationBasis`,
      IDENTIFICATION_BASIS_VALUES,
    ),
    pesel: readRedactedSensitiveValue(personal['pesel'], `${path}.pesel`),
    nip: readEdgeNullableString(personal['nip'], `${path}.nip`),
    identityDocumentKind: readEdgeNullableLiteral(
      personal['identityDocumentKind'],
      `${path}.identityDocumentKind`,
      IDENTITY_DOCUMENT_KIND_VALUES,
    ),
    identityDocumentNumber: readRedactedSensitiveValue(
      personal['identityDocumentNumber'],
      `${path}.identityDocumentNumber`,
    ),
    citizenship: readEdgeString(
      personal['citizenship'],
      `${path}.citizenship`,
    ),
    phone: readEdgeString(personal['phone'], `${path}.phone`),
  };
}

function parseInstitutions(
  value: unknown,
): ICoworkerQuestionnaireInstitutionsData {
  const path = 'data.institutions';
  const institutions = readEdgeObject(value, path);

  return {
    taxOffice: parseReference(
      institutions['taxOffice'],
      `${path}.taxOffice`,
      /^\d{4}$/,
    ),
    nfzBranch: parseReference(
      institutions['nfzBranch'],
      `${path}.nfzBranch`,
      /^(?:0[1-9]|1[0-6])$/,
    ),
  };
}

function parseReference(
  value: unknown,
  path: string,
  codePattern: RegExp,
): QuestionnaireInstitutionReference {
  if (value === null) return null;

  const reference = readEdgeObject(value, path);
  const kind = readEdgeLiteral(
    reference['kind'],
    `${path}.kind`,
    ['catalog', 'legacy'] as const,
  );
  const name = readEdgeString(reference['name'], `${path}.name`);
  assertEdgeContract(name.trim() !== '', `${path}.name`, 'a non-empty string');

  if (kind === 'legacy') {
    assertEdgeContract(reference['code'] === null, `${path}.code`, 'null');
    return { kind, code: null, name };
  }

  const code = readEdgeString(reference['code'], `${path}.code`);
  assertEdgeContract(codePattern.test(code), `${path}.code`, 'a valid code');
  return { kind, code, name };
}

function parsePayment(value: unknown): ICoworkerQuestionnaireReadPaymentData {
  const path = 'data.payment';
  const payment = readEdgeObject(value, path);

  return {
    bankName: readEdgeString(payment['bankName'], `${path}.bankName`),
    bankAccount: readRedactedSensitiveValue(
      payment['bankAccount'],
      `${path}.bankAccount`,
    ),
  };
}

function readRedactedSensitiveValue(value: unknown, path: string): '' {
  const parsed = readEdgeString(value, path);
  assertEdgeContract(parsed === '', path, 'an empty redacted string');
  return '';
}
