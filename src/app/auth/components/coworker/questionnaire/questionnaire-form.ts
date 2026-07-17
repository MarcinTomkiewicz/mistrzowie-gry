import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl } from '@angular/forms';

import {
  ICoworkerQuestionnairePayload,
  ICoworkerQuestionnaireReadPayload,
} from '../../../../core/interfaces/i-coworker-questionnaire';
import {
  CoworkerCorrespondenceAddressForm,
  CoworkerQuestionnaireForm,
} from '../../../../core/types/coworker-questionnaire-form';
import {
  QuestionnaireYesNo,
  QuestionnaireYesNoNotApplicable,
} from '../../../../core/types/coworker-questionnaire';
import { setControlEnabled } from '../../../../core/utils/form-controls';

export function createCoworkerQuestionnaireForm(
  formBuilder: FormBuilder,
  destroyRef: DestroyRef,
  initial: ICoworkerQuestionnaireReadPayload | null = null,
): CoworkerQuestionnaireForm {
  const form = formBuilder.group({
    personal: formBuilder.group({
      firstName: formBuilder.nonNullable.control(initial?.personal.firstName ?? ''),
      lastName: formBuilder.nonNullable.control(initial?.personal.lastName ?? ''),
      maidenName: formBuilder.nonNullable.control(initial?.personal.maidenName ?? ''),
      middleName: formBuilder.nonNullable.control(initial?.personal.middleName ?? ''),
      birthDate: formBuilder.nonNullable.control(initial?.personal.birthDate ?? ''),
      birthPlace: formBuilder.nonNullable.control(initial?.personal.birthPlace ?? ''),
      identificationBasis: formBuilder.nonNullable.control(
        initial?.personal.identificationBasis ?? 'pesel',
      ),
      pesel: formBuilder.nonNullable.control(initial?.personal.pesel ?? ''),
      nip: formBuilder.nonNullable.control(initial?.personal.nip ?? ''),
      identityDocumentKind: formBuilder.control(
        initial?.personal.identityDocumentKind ?? null,
      ),
      identityDocumentNumber: formBuilder.nonNullable.control(
        initial?.personal.identityDocumentNumber ?? '',
      ),
      citizenship: formBuilder.nonNullable.control(initial?.personal.citizenship ?? ''),
      phone: formBuilder.nonNullable.control(initial?.personal.phone ?? ''),
    }),
    registeredAddress: formBuilder.group({
      street: formBuilder.nonNullable.control(initial?.registeredAddress.street ?? ''),
      houseNumber: formBuilder.nonNullable.control(
        initial?.registeredAddress.houseNumber ?? '',
      ),
      apartmentNumber: formBuilder.nonNullable.control(
        initial?.registeredAddress.apartmentNumber ?? '',
      ),
      postalCode: formBuilder.nonNullable.control(
        initial?.registeredAddress.postalCode ?? '',
      ),
      city: formBuilder.nonNullable.control(initial?.registeredAddress.city ?? ''),
      country: formBuilder.nonNullable.control(initial?.registeredAddress.country ?? ''),
    }),
    correspondenceAddress: formBuilder.group({
      sameAsRegistered: formBuilder.nonNullable.control(
        initial?.correspondenceAddress.sameAsRegistered ?? true,
      ),
      street: formBuilder.nonNullable.control(initial?.correspondenceAddress.street ?? ''),
      houseNumber: formBuilder.nonNullable.control(
        initial?.correspondenceAddress.houseNumber ?? '',
      ),
      apartmentNumber: formBuilder.nonNullable.control(
        initial?.correspondenceAddress.apartmentNumber ?? '',
      ),
      postalCode: formBuilder.nonNullable.control(
        initial?.correspondenceAddress.postalCode ?? '',
      ),
      city: formBuilder.nonNullable.control(initial?.correspondenceAddress.city ?? ''),
      country: formBuilder.nonNullable.control(initial?.correspondenceAddress.country ?? ''),
    }),
    institutions: formBuilder.group({
      taxOffice: formBuilder.nonNullable.control(initial?.institutions.taxOffice ?? ''),
      nfzBranch: formBuilder.nonNullable.control(initial?.institutions.nfzBranch ?? ''),
    }),
    insurance: formBuilder.group({
      otherEmployment: formBuilder.nonNullable.control(
        initial?.insurance.otherEmployment ?? 'no',
      ),
      otherEmploymentAtLeastMinimumWage: formBuilder.nonNullable.control(
        initial?.insurance.otherEmploymentAtLeastMinimumWage ?? 'not_applicable',
      ),
      studentUnder26: formBuilder.nonNullable.control(
        initial?.insurance.studentUnder26 ?? 'no',
      ),
      otherMandateContract: formBuilder.nonNullable.control(
        initial?.insurance.otherMandateContract ?? 'no',
      ),
      otherMandateContractSocialInsurance: formBuilder.nonNullable.control(
        initial?.insurance.otherMandateContractSocialInsurance ?? 'not_applicable',
      ),
      subjectToCompulsorySocialInsurance: formBuilder.nonNullable.control(
        initial?.insurance.subjectToCompulsorySocialInsurance ?? 'no',
      ),
      voluntarySicknessInsurance: formBuilder.nonNullable.control(
        initial?.insurance.voluntarySicknessInsurance ?? 'decline',
      ),
      voluntarySicknessInsuranceJoinConfirmed: formBuilder.nonNullable.control(
        initial?.insurance.voluntarySicknessInsuranceJoinConfirmed ?? false,
      ),
      pensionDisabilityInsurance: formBuilder.nonNullable.control(
        initial?.insurance.pensionDisabilityInsurance ?? 'not_applicable',
      ),
      disabilityDegree: formBuilder.nonNullable.control(
        initial?.insurance.disabilityDegree ?? 'none',
      ),
      registeredAtEmploymentOffice: formBuilder.nonNullable.control(
        initial?.insurance.registeredAtEmploymentOffice ?? 'no',
      ),
    }),
    payment: formBuilder.group({
      bankName: formBuilder.nonNullable.control(initial?.payment.bankName ?? ''),
      bankAccount: formBuilder.nonNullable.control(initial?.payment.bankAccount ?? ''),
    }),
  });

  bindCorrespondenceAddress(form.controls.correspondenceAddress, destroyRef);
  bindNotApplicableControl(
    form.controls.insurance.controls.otherEmployment,
    form.controls.insurance.controls.otherEmploymentAtLeastMinimumWage,
    destroyRef,
  );
  bindNotApplicableControl(
    form.controls.insurance.controls.otherMandateContract,
    form.controls.insurance.controls.otherMandateContractSocialInsurance,
    destroyRef,
  );

  return form;
}

export function buildCoworkerQuestionnairePayload(
  form: CoworkerQuestionnaireForm,
): ICoworkerQuestionnairePayload {
  const value = form.getRawValue();

  return {
    personal: {
      firstName: value.personal.firstName,
      lastName: value.personal.lastName,
      maidenName: emptyStringToNull(value.personal.maidenName),
      middleName: emptyStringToNull(value.personal.middleName),
      birthDate: value.personal.birthDate,
      birthPlace: value.personal.birthPlace,
      identificationBasis: value.personal.identificationBasis,
      pesel: value.personal.pesel,
      nip: emptyStringToNull(value.personal.nip),
      identityDocumentKind: value.personal.identityDocumentKind,
      identityDocumentNumber: value.personal.identityDocumentNumber,
      citizenship: value.personal.citizenship,
      phone: value.personal.phone,
    },
    registeredAddress: {
      street: value.registeredAddress.street,
      houseNumber: value.registeredAddress.houseNumber,
      apartmentNumber: emptyStringToNull(value.registeredAddress.apartmentNumber),
      postalCode: value.registeredAddress.postalCode,
      city: value.registeredAddress.city,
      country: value.registeredAddress.country,
    },
    correspondenceAddress: {
      sameAsRegistered: value.correspondenceAddress.sameAsRegistered,
      street: emptyStringToNull(value.correspondenceAddress.street),
      houseNumber: emptyStringToNull(value.correspondenceAddress.houseNumber),
      apartmentNumber: emptyStringToNull(
        value.correspondenceAddress.apartmentNumber,
      ),
      postalCode: emptyStringToNull(value.correspondenceAddress.postalCode),
      city: emptyStringToNull(value.correspondenceAddress.city),
      country: emptyStringToNull(value.correspondenceAddress.country),
    },
    institutions: {
      taxOffice: value.institutions.taxOffice,
      nfzBranch: value.institutions.nfzBranch,
    },
    insurance: {
      otherEmployment: value.insurance.otherEmployment,
      otherEmploymentAtLeastMinimumWage:
        value.insurance.otherEmploymentAtLeastMinimumWage,
      studentUnder26: value.insurance.studentUnder26,
      otherMandateContract: value.insurance.otherMandateContract,
      otherMandateContractSocialInsurance:
        value.insurance.otherMandateContractSocialInsurance,
      subjectToCompulsorySocialInsurance:
        value.insurance.subjectToCompulsorySocialInsurance,
      voluntarySicknessInsurance: value.insurance.voluntarySicknessInsurance,
      voluntarySicknessInsuranceJoinConfirmed:
        value.insurance.voluntarySicknessInsuranceJoinConfirmed,
      pensionDisabilityInsurance: value.insurance.pensionDisabilityInsurance,
      disabilityDegree: value.insurance.disabilityDegree,
      registeredAtEmploymentOffice: value.insurance.registeredAtEmploymentOffice,
    },
    payment: {
      bankName: value.payment.bankName,
      bankAccount: value.payment.bankAccount,
    },
  };
}

function bindCorrespondenceAddress(
  form: CoworkerCorrespondenceAddressForm,
  destroyRef: DestroyRef,
): void {
  setCorrespondenceAddressEnabled(form, !form.controls.sameAsRegistered.value);

  form.controls.sameAsRegistered.valueChanges
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((sameAsRegistered) =>
      setCorrespondenceAddressEnabled(form, !sameAsRegistered),
    );
}

function setCorrespondenceAddressEnabled(
  form: CoworkerCorrespondenceAddressForm,
  enabled: boolean,
): void {
  const controls = [
    form.controls.street,
    form.controls.houseNumber,
    form.controls.apartmentNumber,
    form.controls.postalCode,
    form.controls.city,
    form.controls.country,
  ];

  for (const control of controls) {
    setControlEnabled(control, enabled);
  }
}

function bindNotApplicableControl(
  controlling: FormControl<QuestionnaireYesNo>,
  dependent: FormControl<QuestionnaireYesNoNotApplicable>,
  destroyRef: DestroyRef,
): void {
  let lastApplicableValue: QuestionnaireYesNo | null =
    dependent.value === 'not_applicable' ? null : dependent.value;

  const applyControllingValue = (value: QuestionnaireYesNo): void => {
    if (value === 'no') {
      if (dependent.value !== 'not_applicable') {
        lastApplicableValue = dependent.value;
      }
      dependent.setValue('not_applicable', { emitEvent: false });
      setControlEnabled(dependent, false);
      return;
    }

    setControlEnabled(dependent, true);
    if (dependent.value === 'not_applicable' && lastApplicableValue !== null) {
      dependent.setValue(lastApplicableValue, { emitEvent: false });
    }
  };

  applyControllingValue(controlling.value);
  controlling.valueChanges
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe(applyControllingValue);
}

function emptyStringToNull(value: string): string | null {
  return value === '' ? null : value;
}
