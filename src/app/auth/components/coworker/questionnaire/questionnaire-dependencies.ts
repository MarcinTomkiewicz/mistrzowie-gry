import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';

import {
  CoworkerCorrespondenceAddressForm,
  CoworkerQuestionnaireForm,
  CoworkerQuestionnaireInsuranceForm,
  CoworkerQuestionnairePersonalForm,
} from '../../../../core/types/coworker-questionnaire-form';
import { QuestionnaireYesNo } from '../../../../core/types/coworker-questionnaire';
import { setControlEnabled } from '../../../../core/utils/form-controls';

export function bindQuestionnaireDependencies(
  form: CoworkerQuestionnaireForm,
): Subscription {
  const binding = new Subscription();
  binding.add(bindIdentificationBasis(form.controls.personal));
  binding.add(bindCorrespondenceAddress(form.controls.correspondenceAddress));
  binding.add(
    bindLegacyCountry(
      form.controls.registeredAddress.controls.countryCode,
      form.controls.registeredAddress.controls.legacyCountryName,
    ),
  );
  binding.add(
    bindLegacyCountry(
      form.controls.correspondenceAddress.controls.countryCode,
      form.controls.correspondenceAddress.controls.legacyCountryName,
    ),
  );
  binding.add(bindInsurance(form.controls.insurance));
  return binding;
}

function bindIdentificationBasis(
  form: CoworkerQuestionnairePersonalForm,
): Subscription {
  const apply = (): void => {
    const basis = form.controls.identificationBasis.value;
    const usesPesel = basis === 'pesel';
    const usesDocument = basis === 'identity_document';

    if (!usesPesel) form.controls.pesel.setValue('', { emitEvent: false });
    if (!usesDocument) {
      form.controls.identityDocumentKind.setValue(null, { emitEvent: false });
      form.controls.identityDocumentNumber.setValue('', { emitEvent: false });
    }
    setControlEnabled(form.controls.pesel, usesPesel);
    setControlEnabled(form.controls.identityDocumentKind, usesDocument);
    setControlEnabled(form.controls.identityDocumentNumber, usesDocument);
  };

  apply();
  return form.controls.identificationBasis.valueChanges.subscribe(apply);
}

function bindCorrespondenceAddress(
  form: CoworkerCorrespondenceAddressForm,
): Subscription {
  const controls = [
    form.controls.street,
    form.controls.houseNumber,
    form.controls.apartmentNumber,
    form.controls.postalCode,
    form.controls.city,
    form.controls.countryCode,
    form.controls.legacyCountryName,
  ];
  const apply = (sameAsRegistered: boolean): void => {
    for (const control of controls) {
      if (sameAsRegistered) control.setValue(null, { emitEvent: false });
      setControlEnabled(control, !sameAsRegistered);
    }
  };

  apply(form.controls.sameAsRegistered.value);
  return form.controls.sameAsRegistered.valueChanges.subscribe(apply);
}

function bindLegacyCountry<TCode extends string>(
  countryCode: FormControl<TCode | null>,
  legacyCountryName: FormControl<string | null>,
): Subscription {
  return countryCode.valueChanges.subscribe((code) => {
    if (code !== null) {
      legacyCountryName.setValue(null, { emitEvent: false });
    }
  });
}

function bindInsurance(
  form: CoworkerQuestionnaireInsuranceForm,
): Subscription {
  const binding = new Subscription();
  binding.add(
    bindYesDependencies(
      form.controls.otherEmployment,
      () => {
        form.controls.otherEmployerName.setValue(null, { emitEvent: false });
        form.controls.otherEmploymentAtLeastMinimumWage.setValue(null, {
          emitEvent: false,
        });
      },
      (enabled) => {
        setControlEnabled(form.controls.otherEmployerName, enabled);
        setControlEnabled(
          form.controls.otherEmploymentAtLeastMinimumWage,
          enabled,
        );
      },
    ),
  );
  binding.add(
    bindYesDependencies(
      form.controls.studentUnder26,
      () =>
        form.controls.schoolOrUniversityName.setValue(null, {
          emitEvent: false,
        }),
      (enabled) =>
        setControlEnabled(form.controls.schoolOrUniversityName, enabled),
    ),
  );
  binding.add(
    bindYesDependencies(
      form.controls.otherMandateContract,
      () => {
        form.controls.otherPrincipalName.setValue(null, { emitEvent: false });
        form.controls.otherMandateContractSocialInsurance.setValue(null, {
          emitEvent: false,
        });
      },
      (enabled) => {
        setControlEnabled(form.controls.otherPrincipalName, enabled);
        setControlEnabled(
          form.controls.otherMandateContractSocialInsurance,
          enabled,
        );
      },
    ),
  );
  binding.add(
    bindYesDependencies(
      form.controls.registeredAtEmploymentOffice,
      () =>
        form.controls.employmentOfficeAddress.setValue(null, {
          emitEvent: false,
        }),
      (enabled) =>
        setControlEnabled(form.controls.employmentOfficeAddress, enabled),
    ),
  );

  const applySicknessChoice = (): void => {
    const joins = form.controls.voluntarySicknessInsurance.value === 'join';
    if (!joins) {
      form.controls.voluntarySicknessInsuranceJoinConfirmed.setValue(null, {
        emitEvent: false,
      });
    }
    setControlEnabled(
      form.controls.voluntarySicknessInsuranceJoinConfirmed,
      joins,
    );
  };
  applySicknessChoice();
  binding.add(
    form.controls.voluntarySicknessInsurance.valueChanges.subscribe(
      applySicknessChoice,
    ),
  );
  return binding;
}

function bindYesDependencies(
  controlling: FormControl<QuestionnaireYesNo>,
  clear: () => void,
  setEnabled: (enabled: boolean) => void,
): Subscription {
  const apply = (value: QuestionnaireYesNo): void => {
    const enabled = value === 'yes';
    if (!enabled) clear();
    setEnabled(enabled);
  };

  apply(controlling.value);
  return controlling.valueChanges.subscribe(apply);
}
