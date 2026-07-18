import type { CountryCode } from '../types/country-code';
import type {
  ICoworkerQuestionnaireCatalogReference,
  ICoworkerQuestionnaireLegacyReference,
} from './i-coworker-questionnaire-reference';
import type {
  QuestionnaireDisabilityDegree,
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireJoinDeclineAnswer,
  QuestionnaireStatementKey,
  QuestionnaireYesNo,
} from '../types/coworker-questionnaire';

export interface ICoworkerQuestionnairePersonalData {
  firstName: string;
  lastName: string;
  maidenName: string | null;
  middleName: string | null;
  birthDate: string;
  birthPlace: string;
  identificationBasis: QuestionnaireIdentificationBasis;
  pesel: string | null;
  nip: string | null;
  identityDocumentKind: QuestionnaireIdentityDocumentKind;
  identityDocumentNumber: string | null;
  citizenship: string;
  phone: string;
}

export interface ICoworkerQuestionnaireAddressData {
  street: string;
  houseNumber: string;
  apartmentNumber: string | null;
  postalCode: string;
  city: string;
  voivodeship: string | null;
  county: string | null;
  municipality: string | null;
  postOffice: string | null;
  countryCode: CountryCode | null;
  legacyCountryName: string | null;
}

export interface ICoworkerCorrespondenceAddressData {
  sameAsRegistered: boolean;
  street: string | null;
  houseNumber: string | null;
  apartmentNumber: string | null;
  postalCode: string | null;
  city: string | null;
  countryCode: CountryCode | null;
  legacyCountryName: string | null;
}

export interface ICoworkerQuestionnaireInstitutionsData {
  taxOffice:
    | ICoworkerQuestionnaireCatalogReference
    | ICoworkerQuestionnaireLegacyReference
    | null;
  nfzBranch:
    | ICoworkerQuestionnaireCatalogReference
    | ICoworkerQuestionnaireLegacyReference
    | null;
}

export interface ICoworkerQuestionnaireInsuranceData {
  otherEmployment: QuestionnaireYesNo;
  otherEmployerName: string | null;
  otherEmploymentAtLeastMinimumWage: QuestionnaireYesNo;
  studentUnder26: QuestionnaireYesNo;
  schoolOrUniversityName: string | null;
  otherMandateContract: QuestionnaireYesNo;
  otherPrincipalName: string | null;
  otherMandateContractSocialInsurance: QuestionnaireYesNo;
  subjectToCompulsorySocialInsurance: QuestionnaireYesNo;
  voluntarySicknessInsurance: QuestionnaireJoinDeclineAnswer;
  voluntarySicknessInsuranceJoinConfirmed: boolean | null;
  voluntaryPensionDisabilityInsurance: QuestionnaireJoinDeclineAnswer;
  hasPensionOrDisabilityPensionRight: QuestionnaireYesNo;
  disabilityDegree: QuestionnaireDisabilityDegree;
  registeredAtEmploymentOffice: QuestionnaireYesNo;
  employmentOfficeAddress: string | null;
}

export interface ICoworkerQuestionnairePaymentData {
  bankName: string;
  bankAccount: string;
}

export interface ICoworkerQuestionnairePayload {
  personal: ICoworkerQuestionnairePersonalData;
  registeredAddress: ICoworkerQuestionnaireAddressData;
  correspondenceAddress: ICoworkerCorrespondenceAddressData;
  institutions: ICoworkerQuestionnaireInstitutionsData;
  insurance: ICoworkerQuestionnaireInsuranceData;
  payment: ICoworkerQuestionnairePaymentData;
}

export interface ICoworkerQuestionnaireReadPersonalData
  extends Omit<
    ICoworkerQuestionnairePersonalData,
    'pesel' | 'identityDocumentNumber'
  > {
  pesel: '';
  identityDocumentNumber: '';
}

export interface ICoworkerQuestionnaireReadPaymentData
  extends Omit<ICoworkerQuestionnairePaymentData, 'bankAccount'> {
  bankAccount: '';
}

export interface ICoworkerQuestionnaireReadPayload
  extends Omit<ICoworkerQuestionnairePayload, 'personal' | 'payment'> {
  personal: ICoworkerQuestionnaireReadPersonalData;
  payment: ICoworkerQuestionnaireReadPaymentData;
}

export interface ICoworkerSensitiveFieldMetadata {
  configured: boolean;
  masked: string | null;
}

export interface ICoworkerQuestionnaireSensitiveMetadata {
  pesel: ICoworkerSensitiveFieldMetadata;
  identityDocumentNumber: ICoworkerSensitiveFieldMetadata;
  bankAccount: ICoworkerSensitiveFieldMetadata;
}

export interface ICoworkerQuestionnaireFinalDeclaration {
  statementKey: QuestionnaireStatementKey;
  statementVersion: number;
  accepted: true;
}

export interface ICoworkerQuestionnaireStatement {
  statementKey: QuestionnaireStatementKey;
  statementVersion: number;
  statementText: string;
  statementSha256Base64: string;
}

export interface ICoworkerQuestionnaireCurrentDeclaration
  extends ICoworkerQuestionnaireStatement {
  id: string;
  questionnaireRevision: number;
  actorUserId: string;
  source: 'web';
  acceptedAt: string;
}

export interface ICoworkerQuestionnaireGetResponse {
  configured: boolean;
  revision: number | null;
  complete: boolean;
  validationPassed: boolean;
  completedAt: string | null;
  updatedAt: string | null;
  data: ICoworkerQuestionnaireReadPayload | null;
  sensitive: ICoworkerQuestionnaireSensitiveMetadata;
  statement: ICoworkerQuestionnaireStatement;
  currentDeclaration: ICoworkerQuestionnaireCurrentDeclaration | null;
}

export interface ICoworkerQuestionnaireSaveRequest {
  data: ICoworkerQuestionnairePayload;
  complete: boolean;
  expectedRevision: number | null;
  finalDeclaration: ICoworkerQuestionnaireFinalDeclaration | null;
}

export interface ICoworkerQuestionnaireSaveResponse {
  saved: true;
  revision: number;
  complete: boolean;
  validationPassed: boolean;
  completedAt: string | null;
  updatedAt: string;
  sensitive: ICoworkerQuestionnaireSensitiveMetadata;
  statement: ICoworkerQuestionnaireStatement;
  currentDeclaration: ICoworkerQuestionnaireCurrentDeclaration | null;
}
