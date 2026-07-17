import { FormControl, FormGroup } from '@angular/forms';

import {
  QuestionnaireDisabilityDegree,
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireSicknessInsuranceChoice,
  QuestionnaireYesNo,
  QuestionnaireYesNoNotApplicable,
} from './coworker-questionnaire';

export type CoworkerQuestionnairePersonalForm = FormGroup<{
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  maidenName: FormControl<string>;
  middleName: FormControl<string>;
  birthDate: FormControl<string>;
  birthPlace: FormControl<string>;
  identificationBasis: FormControl<QuestionnaireIdentificationBasis>;
  pesel: FormControl<string>;
  nip: FormControl<string>;
  identityDocumentKind: FormControl<QuestionnaireIdentityDocumentKind | null>;
  identityDocumentNumber: FormControl<string>;
  citizenship: FormControl<string>;
  phone: FormControl<string>;
}>;

export type CoworkerQuestionnaireAddressForm = FormGroup<{
  street: FormControl<string>;
  houseNumber: FormControl<string>;
  apartmentNumber: FormControl<string>;
  postalCode: FormControl<string>;
  city: FormControl<string>;
  country: FormControl<string>;
}>;

export type CoworkerCorrespondenceAddressForm = FormGroup<{
  sameAsRegistered: FormControl<boolean>;
  street: FormControl<string>;
  houseNumber: FormControl<string>;
  apartmentNumber: FormControl<string>;
  postalCode: FormControl<string>;
  city: FormControl<string>;
  country: FormControl<string>;
}>;

export type CoworkerQuestionnaireInstitutionsForm = FormGroup<{
  taxOffice: FormControl<string>;
  nfzBranch: FormControl<string>;
}>;

export type CoworkerQuestionnaireInsuranceForm = FormGroup<{
  otherEmployment: FormControl<QuestionnaireYesNo>;
  otherEmploymentAtLeastMinimumWage: FormControl<QuestionnaireYesNoNotApplicable>;
  studentUnder26: FormControl<QuestionnaireYesNo>;
  otherMandateContract: FormControl<QuestionnaireYesNo>;
  otherMandateContractSocialInsurance: FormControl<QuestionnaireYesNoNotApplicable>;
  subjectToCompulsorySocialInsurance: FormControl<QuestionnaireYesNo>;
  voluntarySicknessInsurance: FormControl<QuestionnaireSicknessInsuranceChoice>;
  voluntarySicknessInsuranceJoinConfirmed: FormControl<boolean>;
  pensionDisabilityInsurance: FormControl<QuestionnaireYesNoNotApplicable>;
  disabilityDegree: FormControl<QuestionnaireDisabilityDegree>;
  registeredAtEmploymentOffice: FormControl<QuestionnaireYesNo>;
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
}>;
