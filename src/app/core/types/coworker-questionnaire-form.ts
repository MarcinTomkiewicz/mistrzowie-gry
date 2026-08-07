import { FormControl, FormGroup } from '@angular/forms';

import type { CountryCode } from './country-code';
import type {
  QuestionnaireDisabilityDegree,
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireInstitutionReference,
  QuestionnaireJoinDeclineAnswer,
  QuestionnaireYesNo,
} from './coworker-questionnaire';

export type QuestionnaireChoiceValue = Exclude<
  | QuestionnaireIdentificationBasis
  | QuestionnaireIdentityDocumentKind
  | QuestionnaireJoinDeclineAnswer
  | QuestionnaireYesNo,
  null
>;

export type QuestionnaireChoiceControl =
  | FormControl<QuestionnaireIdentificationBasis>
  | FormControl<QuestionnaireIdentityDocumentKind>
  | FormControl<QuestionnaireJoinDeclineAnswer>
  | FormControl<QuestionnaireYesNo>;

export type CoworkerQuestionnairePersonalForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  maidenName: FormControl<string | null>;
  middleName: FormControl<string | null>;
  birthDate: FormControl<string>;
  birthPlace: FormControl<string>;
  identificationBasis: FormControl<QuestionnaireIdentificationBasis>;
  pesel: FormControl<string>;
  nip: FormControl<string | null>;
  identityDocumentKind: FormControl<QuestionnaireIdentityDocumentKind>;
  identityDocumentNumber: FormControl<string>;
  citizenship: FormControl<string>;
  phone: FormControl<string>;
}>;

export type CoworkerQuestionnaireAddressForm = FormGroup<{
  street: FormControl<string>;
  houseNumber: FormControl<string>;
  apartmentNumber: FormControl<string | null>;
  postalCode: FormControl<string>;
  city: FormControl<string>;
  voivodeship: FormControl<string | null>;
  county: FormControl<string | null>;
  municipality: FormControl<string | null>;
  postOffice: FormControl<string | null>;
  countryCode: FormControl<CountryCode | null>;
  legacyCountryName: FormControl<string | null>;
}>;

export type CoworkerCorrespondenceAddressForm = FormGroup<{
  sameAsRegistered: FormControl<boolean>;
  street: FormControl<string | null>;
  houseNumber: FormControl<string | null>;
  apartmentNumber: FormControl<string | null>;
  postalCode: FormControl<string | null>;
  city: FormControl<string | null>;
  countryCode: FormControl<CountryCode | null>;
  legacyCountryName: FormControl<string | null>;
}>;

export type CoworkerQuestionnaireInstitutionsForm = FormGroup<{
  taxOffice: FormControl<QuestionnaireInstitutionReference>;
  nfzBranch: FormControl<QuestionnaireInstitutionReference>;
}>;

export type CoworkerQuestionnaireInsuranceForm = FormGroup<{
  otherEmployment: FormControl<QuestionnaireYesNo>;
  otherEmployerName: FormControl<string | null>;
  otherEmploymentAtLeastMinimumWage: FormControl<QuestionnaireYesNo>;
  studentUnder26: FormControl<QuestionnaireYesNo>;
  schoolOrUniversityName: FormControl<string | null>;
  otherMandateContract: FormControl<QuestionnaireYesNo>;
  otherPrincipalName: FormControl<string | null>;
  otherMandateContractSocialInsurance: FormControl<QuestionnaireYesNo>;
  subjectToCompulsorySocialInsurance: FormControl<QuestionnaireYesNo>;
  voluntarySicknessInsurance: FormControl<QuestionnaireJoinDeclineAnswer>;
  voluntarySicknessInsuranceJoinConfirmed: FormControl<boolean | null>;
  voluntaryPensionDisabilityInsurance: FormControl<QuestionnaireJoinDeclineAnswer>;
  hasPensionOrDisabilityPensionRight: FormControl<QuestionnaireYesNo>;
  disabilityDegree: FormControl<QuestionnaireDisabilityDegree>;
  registeredAtEmploymentOffice: FormControl<QuestionnaireYesNo>;
  employmentOfficeAddress: FormControl<string | null>;
}>;

export type CoworkerQuestionnairePaymentForm = FormGroup<{
  bankName: FormControl<string>;
  bankAccount: FormControl<string>;
}>;

export type CoworkerQuestionnaireForm = FormGroup<{
  personal: CoworkerQuestionnairePersonalForm;
  registeredAddress: CoworkerQuestionnaireAddressForm;
  correspondenceAddress: CoworkerCorrespondenceAddressForm;
  institutions: CoworkerQuestionnaireInstitutionsForm;
  insurance: CoworkerQuestionnaireInsuranceForm;
  payment: CoworkerQuestionnairePaymentForm;
  finalDeclarationAccepted: FormControl<boolean>;
}>;
