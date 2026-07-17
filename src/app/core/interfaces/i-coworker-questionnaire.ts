import {
  QuestionnaireDisabilityDegree,
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireSicknessInsuranceChoice,
  QuestionnaireYesNo,
  QuestionnaireYesNoNotApplicable,
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
  identityDocumentKind: QuestionnaireIdentityDocumentKind | null;
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
  country: string;
}

export interface ICoworkerCorrespondenceAddressData {
  sameAsRegistered: boolean;
  street: string | null;
  houseNumber: string | null;
  apartmentNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

export interface ICoworkerQuestionnaireInstitutionsData {
  taxOffice: string;
  nfzBranch: string;
}

export interface ICoworkerQuestionnaireInsuranceData {
  otherEmployment: QuestionnaireYesNo;
  otherEmploymentAtLeastMinimumWage: QuestionnaireYesNoNotApplicable;
  studentUnder26: QuestionnaireYesNo;
  otherMandateContract: QuestionnaireYesNo;
  otherMandateContractSocialInsurance: QuestionnaireYesNoNotApplicable;
  subjectToCompulsorySocialInsurance: QuestionnaireYesNo;
  voluntarySicknessInsurance: QuestionnaireSicknessInsuranceChoice;
  voluntarySicknessInsuranceJoinConfirmed: boolean;
  pensionDisabilityInsurance: QuestionnaireYesNoNotApplicable;
  disabilityDegree: QuestionnaireDisabilityDegree;
  registeredAtEmploymentOffice: QuestionnaireYesNo;
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
  pesel: string;
  identityDocumentNumber: string;
}

export interface ICoworkerQuestionnaireReadPayload
  extends Omit<ICoworkerQuestionnairePayload, 'personal'> {
  personal: ICoworkerQuestionnaireReadPersonalData;
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

export interface ICoworkerQuestionnaireGetResponse {
  configured: boolean;
  revision: number | null;
  complete: boolean;
  data: ICoworkerQuestionnaireReadPayload | null;
  sensitive: ICoworkerQuestionnaireSensitiveMetadata;
}

export interface ICoworkerQuestionnaireSaveRequest {
  data: ICoworkerQuestionnairePayload;
  complete: boolean;
}

export interface ICoworkerQuestionnaireSaveResponse {
  saved: true;
  revision: number;
  complete: boolean;
  validationPassed: boolean;
  sensitive: ICoworkerQuestionnaireSensitiveMetadata;
}
