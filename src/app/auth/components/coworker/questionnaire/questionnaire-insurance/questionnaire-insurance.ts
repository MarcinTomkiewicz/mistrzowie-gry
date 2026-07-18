import { Component, computed, input } from '@angular/core';

import { ISelectOption } from '../../../../../core/interfaces/i-select-option';
import { CoworkerQuestionnaireInsuranceForm } from '../../../../../core/types/coworker-questionnaire-form';
import {
  QuestionnaireDisabilityDegree,
  QuestionnaireJoinDeclineAnswer,
  QuestionnaireYesNo,
} from '../../../../../core/types/coworker-questionnaire';
import { createQuestionnaireI18n } from '../questionnaire.i18n';
import { QuestionnaireInsuranceContracts } from './questionnaire-insurance-contracts';
import { QuestionnaireInsuranceElections } from './questionnaire-insurance-elections';
import { QuestionnaireInsuranceEmployment } from './questionnaire-insurance-employment';
import { QuestionnaireInsuranceStatus } from './questionnaire-insurance-status';

@Component({
  selector: 'app-questionnaire-insurance',
  standalone: true,
  imports: [
    QuestionnaireInsuranceContracts,
    QuestionnaireInsuranceElections,
    QuestionnaireInsuranceEmployment,
    QuestionnaireInsuranceStatus,
  ],
  templateUrl: './questionnaire-insurance.html',
})
export class QuestionnaireInsurance {
  readonly form = input.required<CoworkerQuestionnaireInsuranceForm>();

  protected readonly i18n = createQuestionnaireI18n();
  protected readonly yesNoOptions = computed<
    ISelectOption<Exclude<QuestionnaireYesNo, null>>[]
  >(() => [
    { value: 'yes', label: this.i18n.options().yes },
    { value: 'no', label: this.i18n.options().no },
  ]);
  protected readonly insuranceChoiceOptions = computed<
    ISelectOption<Exclude<QuestionnaireJoinDeclineAnswer, null>>[]
  >(() => [
    { value: 'join', label: this.i18n.options().join },
    { value: 'decline', label: this.i18n.options().decline },
  ]);
  protected readonly disabilityDegreeOptions = computed<
    ISelectOption<Exclude<QuestionnaireDisabilityDegree, null>>[]
  >(() => [
    { value: 'none', label: this.i18n.options().disabilityNone },
    { value: 'light', label: this.i18n.options().disabilityLight },
    { value: 'moderate', label: this.i18n.options().disabilityModerate },
    { value: 'severe', label: this.i18n.options().disabilitySevere },
  ]);
}
