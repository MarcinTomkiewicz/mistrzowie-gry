import { FormBuilder } from '@angular/forms';

import type { ICoworkerQuestionnaireReadPayload } from '../../../../core/interfaces/i-coworker-questionnaire';
import type { CountryCode } from '../../../../core/types/country-code';
import type { CoworkerQuestionnaireForm } from '../../../../core/types/coworker-questionnaire-form';
import type {
  QuestionnaireDisabilityDegree,
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireInstitutionReference,
  QuestionnaireJoinDeclineAnswer,
  QuestionnaireYesNo,
} from '../../../../core/types/coworker-questionnaire';
import { normalizeKnownCitizenship } from '../../../../core/utils/citizenship-options';

export function createCoworkerQuestionnaireForm(
  formBuilder: FormBuilder,
  initial: ICoworkerQuestionnaireReadPayload | null = null,
): CoworkerQuestionnaireForm {
  const form = formBuilder.group({
    personal: formBuilder.group({
      firstName: formBuilder.nonNullable.control(initial?.personal.firstName ?? ''),
      lastName: formBuilder.nonNullable.control(initial?.personal.lastName ?? ''),
      maidenName: formBuilder.control<string | null>(
        initial?.personal.maidenName ?? null,
      ),
      middleName: formBuilder.control<string | null>(
        initial?.personal.middleName ?? null,
      ),
      birthDate: formBuilder.nonNullable.control(initial?.personal.birthDate ?? ''),
      birthPlace: formBuilder.nonNullable.control(initial?.personal.birthPlace ?? ''),
      identificationBasis: formBuilder.control<QuestionnaireIdentificationBasis>(
        initial?.personal.identificationBasis ?? null,
      ),
      pesel: formBuilder.nonNullable.control(''),
      nip: formBuilder.control<string | null>(initial?.personal.nip ?? null),
      identityDocumentKind: formBuilder.control<QuestionnaireIdentityDocumentKind>(
        initial?.personal.identityDocumentKind ?? null,
      ),
      identityDocumentNumber: formBuilder.nonNullable.control(''),
      citizenship: formBuilder.nonNullable.control(
        normalizeKnownCitizenship(initial?.personal.citizenship ?? ''),
      ),
      phone: formBuilder.nonNullable.control(initial?.personal.phone ?? ''),
    }),
    registeredAddress: formBuilder.group({
      street: formBuilder.nonNullable.control(initial?.registeredAddress.street ?? ''),
      houseNumber: formBuilder.nonNullable.control(
        initial?.registeredAddress.houseNumber ?? '',
      ),
      apartmentNumber: formBuilder.control<string | null>(
        initial?.registeredAddress.apartmentNumber ?? null,
      ),
      postalCode: formBuilder.nonNullable.control(
        initial?.registeredAddress.postalCode ?? '',
      ),
      city: formBuilder.nonNullable.control(initial?.registeredAddress.city ?? ''),
      voivodeship: formBuilder.control<string | null>(
        initial?.registeredAddress.voivodeship ?? null,
      ),
      county: formBuilder.control<string | null>(
        initial?.registeredAddress.county ?? null,
      ),
      municipality: formBuilder.control<string | null>(
        initial?.registeredAddress.municipality ?? null,
      ),
      postOffice: formBuilder.control<string | null>(
        initial?.registeredAddress.postOffice ?? null,
      ),
      countryCode: formBuilder.control<CountryCode | null>(
        initial?.registeredAddress.countryCode ?? null,
      ),
      legacyCountryName: formBuilder.control<string | null>(
        initial?.registeredAddress.legacyCountryName ?? null,
      ),
    }),
    correspondenceAddress: formBuilder.group({
      sameAsRegistered: formBuilder.nonNullable.control(
        initial?.correspondenceAddress.sameAsRegistered ?? false,
      ),
      street: formBuilder.control<string | null>(
        initial?.correspondenceAddress.street ?? null,
      ),
      houseNumber: formBuilder.control<string | null>(
        initial?.correspondenceAddress.houseNumber ?? null,
      ),
      apartmentNumber: formBuilder.control<string | null>(
        initial?.correspondenceAddress.apartmentNumber ?? null,
      ),
      postalCode: formBuilder.control<string | null>(
        initial?.correspondenceAddress.postalCode ?? null,
      ),
      city: formBuilder.control<string | null>(
        initial?.correspondenceAddress.city ?? null,
      ),
      countryCode: formBuilder.control<CountryCode | null>(
        initial?.correspondenceAddress.countryCode ?? null,
      ),
      legacyCountryName: formBuilder.control<string | null>(
        initial?.correspondenceAddress.legacyCountryName ?? null,
      ),
    }),
    institutions: formBuilder.group({
      taxOffice: formBuilder.control<QuestionnaireInstitutionReference>(
        initial?.institutions.taxOffice ?? null,
      ),
      nfzBranch: formBuilder.control<QuestionnaireInstitutionReference>(
        initial?.institutions.nfzBranch ?? null,
      ),
    }),
    insurance: formBuilder.group({
      otherEmployment: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.otherEmployment ?? null,
      ),
      otherEmployerName: formBuilder.control<string | null>(
        initial?.insurance.otherEmployerName ?? null,
      ),
      otherEmploymentAtLeastMinimumWage: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.otherEmploymentAtLeastMinimumWage ?? null,
      ),
      studentUnder26: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.studentUnder26 ?? null,
      ),
      schoolOrUniversityName: formBuilder.control<string | null>(
        initial?.insurance.schoolOrUniversityName ?? null,
      ),
      otherMandateContract: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.otherMandateContract ?? null,
      ),
      otherPrincipalName: formBuilder.control<string | null>(
        initial?.insurance.otherPrincipalName ?? null,
      ),
      otherMandateContractSocialInsurance: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.otherMandateContractSocialInsurance ?? null,
      ),
      subjectToCompulsorySocialInsurance: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.subjectToCompulsorySocialInsurance ?? null,
      ),
      voluntarySicknessInsurance:
        formBuilder.control<QuestionnaireJoinDeclineAnswer>(
          initial?.insurance.voluntarySicknessInsurance ?? null,
        ),
      voluntarySicknessInsuranceJoinConfirmed: formBuilder.control<boolean | null>(
        initial?.insurance.voluntarySicknessInsuranceJoinConfirmed ?? null,
      ),
      voluntaryPensionDisabilityInsurance:
        formBuilder.control<QuestionnaireJoinDeclineAnswer>(
          initial?.insurance.voluntaryPensionDisabilityInsurance ?? null,
        ),
      hasPensionOrDisabilityPensionRight: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.hasPensionOrDisabilityPensionRight ?? null,
      ),
      disabilityDegree: formBuilder.control<QuestionnaireDisabilityDegree>(
        initial?.insurance.disabilityDegree ?? null,
      ),
      registeredAtEmploymentOffice: formBuilder.control<QuestionnaireYesNo>(
        initial?.insurance.registeredAtEmploymentOffice ?? null,
      ),
      employmentOfficeAddress: formBuilder.control<string | null>(
        initial?.insurance.employmentOfficeAddress ?? null,
      ),
    }),
    payment: formBuilder.group({
      bankName: formBuilder.nonNullable.control(initial?.payment.bankName ?? ''),
      bankAccount: formBuilder.nonNullable.control(''),
    }),
    finalDeclarationAccepted: formBuilder.nonNullable.control(false),
  });

  return form;
}
