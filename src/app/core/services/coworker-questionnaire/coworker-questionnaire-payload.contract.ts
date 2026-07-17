import {
  ICoworkerCorrespondenceAddressData,
  ICoworkerQuestionnaireAddressData,
  ICoworkerQuestionnaireInstitutionsData,
  ICoworkerQuestionnaireInsuranceData,
  ICoworkerQuestionnairePaymentData,
  ICoworkerQuestionnaireReadPayload,
} from '../../interfaces/i-coworker-questionnaire';
import {
  QuestionnaireDisabilityDegree,
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireSicknessInsuranceChoice,
  QuestionnaireYesNo,
  QuestionnaireYesNoNotApplicable,
} from '../../types/coworker-questionnaire';
import {
  assertEdgeContract,
  readEdgeBoolean,
  readEdgeLiteral,
  readEdgeNullableLiteral,
  readEdgeNullableString,
  readEdgeObject,
  readEdgeString,
} from '../../utils/edge-contract';

const YES_NO_VALUES: readonly QuestionnaireYesNo[] = ['yes', 'no'];
const YES_NO_NOT_APPLICABLE_VALUES: readonly QuestionnaireYesNoNotApplicable[] = [
  'yes',
  'no',
  'not_applicable',
];
const IDENTIFICATION_BASIS_VALUES: readonly QuestionnaireIdentificationBasis[] = [
  'pesel',
  'identity_document',
];
const IDENTITY_DOCUMENT_KIND_VALUES: readonly QuestionnaireIdentityDocumentKind[] = [
  'id_card',
  'passport',
  'other',
];
const SICKNESS_INSURANCE_VALUES: readonly QuestionnaireSicknessInsuranceChoice[] = [
  'join',
  'decline',
];
const DISABILITY_DEGREE_VALUES: readonly QuestionnaireDisabilityDegree[] = [
  'none',
  'light',
  'moderate',
  'severe',
];

export function parseCoworkerQuestionnaireReadPayload(
  value: unknown,
): ICoworkerQuestionnaireReadPayload {
  const data = readEdgeObject(value, 'data');
  const personal = readEdgeObject(data['personal'], 'data.personal');
  const pesel = readRedactedSensitiveValue(
    personal['pesel'],
    'data.personal.pesel',
  );
  const identityDocumentNumber = readRedactedSensitiveValue(
    personal['identityDocumentNumber'],
    'data.personal.identityDocumentNumber',
  );

  return {
    personal: {
      firstName: readEdgeString(personal['firstName'], 'data.personal.firstName'),
      lastName: readEdgeString(personal['lastName'], 'data.personal.lastName'),
      maidenName: readEdgeNullableString(
        personal['maidenName'],
        'data.personal.maidenName',
      ),
      middleName: readEdgeNullableString(
        personal['middleName'],
        'data.personal.middleName',
      ),
      birthDate: readEdgeString(personal['birthDate'], 'data.personal.birthDate'),
      birthPlace: readEdgeString(personal['birthPlace'], 'data.personal.birthPlace'),
      identificationBasis: readEdgeLiteral(
        personal['identificationBasis'],
        'data.personal.identificationBasis',
        IDENTIFICATION_BASIS_VALUES,
      ),
      pesel,
      nip: readEdgeNullableString(personal['nip'], 'data.personal.nip'),
      identityDocumentKind: readEdgeNullableLiteral(
        personal['identityDocumentKind'],
        'data.personal.identityDocumentKind',
        IDENTITY_DOCUMENT_KIND_VALUES,
      ),
      identityDocumentNumber,
      citizenship: readEdgeString(
        personal['citizenship'],
        'data.personal.citizenship',
      ),
      phone: readEdgeString(personal['phone'], 'data.personal.phone'),
    },
    registeredAddress: parseAddress(
      data['registeredAddress'],
      'data.registeredAddress',
    ),
    correspondenceAddress: parseCorrespondenceAddress(
      data['correspondenceAddress'],
    ),
    institutions: parseInstitutions(data['institutions']),
    insurance: parseInsurance(data['insurance']),
    payment: parsePayment(data['payment']),
  };
}

function parseAddress(
  value: unknown,
  path: string,
): ICoworkerQuestionnaireAddressData {
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
    country: readEdgeString(address['country'], `${path}.country`),
  };
}

function parseCorrespondenceAddress(
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
    country: readEdgeNullableString(address['country'], `${path}.country`),
  };
}

function parseInstitutions(value: unknown): ICoworkerQuestionnaireInstitutionsData {
  const institutions = readEdgeObject(value, 'data.institutions');

  return {
    taxOffice: readEdgeString(
      institutions['taxOffice'],
      'data.institutions.taxOffice',
    ),
    nfzBranch: readEdgeString(
      institutions['nfzBranch'],
      'data.institutions.nfzBranch',
    ),
  };
}

function parseInsurance(value: unknown): ICoworkerQuestionnaireInsuranceData {
  const path = 'data.insurance';
  const insurance = readEdgeObject(value, path);

  return {
    otherEmployment: readEdgeLiteral(
      insurance['otherEmployment'],
      `${path}.otherEmployment`,
      YES_NO_VALUES,
    ),
    otherEmploymentAtLeastMinimumWage: readEdgeLiteral(
      insurance['otherEmploymentAtLeastMinimumWage'],
      `${path}.otherEmploymentAtLeastMinimumWage`,
      YES_NO_NOT_APPLICABLE_VALUES,
    ),
    studentUnder26: readEdgeLiteral(
      insurance['studentUnder26'],
      `${path}.studentUnder26`,
      YES_NO_VALUES,
    ),
    otherMandateContract: readEdgeLiteral(
      insurance['otherMandateContract'],
      `${path}.otherMandateContract`,
      YES_NO_VALUES,
    ),
    otherMandateContractSocialInsurance: readEdgeLiteral(
      insurance['otherMandateContractSocialInsurance'],
      `${path}.otherMandateContractSocialInsurance`,
      YES_NO_NOT_APPLICABLE_VALUES,
    ),
    subjectToCompulsorySocialInsurance: readEdgeLiteral(
      insurance['subjectToCompulsorySocialInsurance'],
      `${path}.subjectToCompulsorySocialInsurance`,
      YES_NO_VALUES,
    ),
    voluntarySicknessInsurance: readEdgeLiteral(
      insurance['voluntarySicknessInsurance'],
      `${path}.voluntarySicknessInsurance`,
      SICKNESS_INSURANCE_VALUES,
    ),
    voluntarySicknessInsuranceJoinConfirmed: readEdgeBoolean(
      insurance['voluntarySicknessInsuranceJoinConfirmed'],
      `${path}.voluntarySicknessInsuranceJoinConfirmed`,
    ),
    pensionDisabilityInsurance: readEdgeLiteral(
      insurance['pensionDisabilityInsurance'],
      `${path}.pensionDisabilityInsurance`,
      YES_NO_NOT_APPLICABLE_VALUES,
    ),
    disabilityDegree: readEdgeLiteral(
      insurance['disabilityDegree'],
      `${path}.disabilityDegree`,
      DISABILITY_DEGREE_VALUES,
    ),
    registeredAtEmploymentOffice: readEdgeLiteral(
      insurance['registeredAtEmploymentOffice'],
      `${path}.registeredAtEmploymentOffice`,
      YES_NO_VALUES,
    ),
  };
}

function parsePayment(value: unknown): ICoworkerQuestionnairePaymentData {
  const payment = readEdgeObject(value, 'data.payment');

  return {
    bankName: readEdgeString(payment['bankName'], 'data.payment.bankName'),
    bankAccount: readRedactedSensitiveValue(
      payment['bankAccount'],
      'data.payment.bankAccount',
    ),
  };
}

function readRedactedSensitiveValue(value: unknown, path: string): string {
  const parsed = readEdgeString(value, path);
  assertEdgeContract(parsed === '', path, 'an empty redacted string');
  return parsed;
}
