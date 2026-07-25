import {
  ICoworkerQuestionnairePayload,
  ICoworkerQuestionnaireSaveRequest,
  ICoworkerQuestionnaireStatement,
} from '../../../../core/interfaces/i-coworker-questionnaire';
import { CoworkerQuestionnaireForm } from '../../../../core/types/coworker-questionnaire-form';
import { normalizeBankAccount } from '../../../../core/utils/bank-account';

export function buildCoworkerQuestionnaireSaveRequest(
  form: CoworkerQuestionnaireForm,
  expectedRevision: number | null,
  complete: boolean,
  statement: ICoworkerQuestionnaireStatement,
): ICoworkerQuestionnaireSaveRequest {
  return {
    data: buildCoworkerQuestionnairePayload(form),
    complete,
    expectedRevision,
    finalDeclaration: complete && form.controls.finalDeclarationAccepted.value
      ? {
          statementKey: statement.statementKey,
          statementVersion: statement.statementVersion,
          accepted: true,
        }
      : null,
  };
}

export function buildCoworkerQuestionnairePayload(
  form: CoworkerQuestionnaireForm,
): ICoworkerQuestionnairePayload {
  const value = form.getRawValue();
  const usesPesel = value.personal.identificationBasis === 'pesel';
  const usesDocument = value.personal.identificationBasis === 'identity_document';
  const sameAsRegistered = value.correspondenceAddress.sameAsRegistered;

  return {
    personal: {
      firstName: value.personal.firstName,
      lastName: value.personal.lastName,
      maidenName: blankToNull(value.personal.maidenName),
      middleName: blankToNull(value.personal.middleName),
      birthDate: value.personal.birthDate,
      birthPlace: value.personal.birthPlace,
      identificationBasis: value.personal.identificationBasis,
      pesel: usesPesel ? blankToNull(value.personal.pesel) : null,
      nip: blankToNull(value.personal.nip),
      identityDocumentKind: usesDocument
        ? value.personal.identityDocumentKind
        : null,
      identityDocumentNumber: usesDocument
        ? blankToNull(value.personal.identityDocumentNumber)
        : null,
      citizenship: value.personal.citizenship,
      phone: value.personal.phone,
    },
    registeredAddress: {
      street: value.registeredAddress.street,
      houseNumber: value.registeredAddress.houseNumber,
      apartmentNumber: blankToNull(value.registeredAddress.apartmentNumber),
      postalCode: value.registeredAddress.postalCode,
      city: value.registeredAddress.city,
      voivodeship: blankToNull(value.registeredAddress.voivodeship),
      county: blankToNull(value.registeredAddress.county),
      municipality: blankToNull(value.registeredAddress.municipality),
      postOffice: blankToNull(value.registeredAddress.postOffice),
      countryCode: value.registeredAddress.countryCode,
      legacyCountryName: value.registeredAddress.countryCode === null
        ? blankToNull(value.registeredAddress.legacyCountryName)
        : null,
    },
    correspondenceAddress: {
      sameAsRegistered,
      street: sameAsRegistered
        ? null
        : blankToNull(value.correspondenceAddress.street),
      houseNumber: sameAsRegistered
        ? null
        : blankToNull(value.correspondenceAddress.houseNumber),
      apartmentNumber: sameAsRegistered
        ? null
        : blankToNull(value.correspondenceAddress.apartmentNumber),
      postalCode: sameAsRegistered
        ? null
        : blankToNull(value.correspondenceAddress.postalCode),
      city: sameAsRegistered
        ? null
        : blankToNull(value.correspondenceAddress.city),
      countryCode: sameAsRegistered
        ? null
        : value.correspondenceAddress.countryCode,
      legacyCountryName: sameAsRegistered ||
          value.correspondenceAddress.countryCode !== null
        ? null
        : blankToNull(value.correspondenceAddress.legacyCountryName),
    },
    institutions: value.institutions,
    insurance: {
      otherEmployment: value.insurance.otherEmployment,
      otherEmployerName: value.insurance.otherEmployment === 'yes'
        ? blankToNull(value.insurance.otherEmployerName)
        : null,
      otherEmploymentAtLeastMinimumWage:
        value.insurance.otherEmployment === 'yes'
          ? value.insurance.otherEmploymentAtLeastMinimumWage
          : null,
      studentUnder26: value.insurance.studentUnder26,
      schoolOrUniversityName: value.insurance.studentUnder26 === 'yes'
        ? blankToNull(value.insurance.schoolOrUniversityName)
        : null,
      otherMandateContract: value.insurance.otherMandateContract,
      otherPrincipalName: value.insurance.otherMandateContract === 'yes'
        ? blankToNull(value.insurance.otherPrincipalName)
        : null,
      otherMandateContractSocialInsurance:
        value.insurance.otherMandateContract === 'yes'
          ? value.insurance.otherMandateContractSocialInsurance
          : null,
      subjectToCompulsorySocialInsurance:
        value.insurance.subjectToCompulsorySocialInsurance,
      voluntarySicknessInsurance: value.insurance.voluntarySicknessInsurance,
      voluntarySicknessInsuranceJoinConfirmed:
        value.insurance.voluntarySicknessInsurance === 'join'
          ? value.insurance.voluntarySicknessInsuranceJoinConfirmed
          : null,
      voluntaryPensionDisabilityInsurance:
        value.insurance.voluntaryPensionDisabilityInsurance,
      hasPensionOrDisabilityPensionRight:
        value.insurance.hasPensionOrDisabilityPensionRight,
      disabilityDegree: value.insurance.disabilityDegree,
      registeredAtEmploymentOffice:
        value.insurance.registeredAtEmploymentOffice,
      employmentOfficeAddress:
        value.insurance.registeredAtEmploymentOffice === 'yes'
          ? blankToNull(value.insurance.employmentOfficeAddress)
          : null,
    },
    payment: {
      bankName: value.payment.bankName,
      bankAccount: normalizeBankAccount(value.payment.bankAccount),
    },
  };
}

function blankToNull(value: string | null): string | null {
  return value === null || value.trim() === '' ? null : value;
}
