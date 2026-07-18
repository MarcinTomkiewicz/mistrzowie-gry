import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';

import { ISelectOption } from '../../../../../core/interfaces/i-select-option';
import { CoworkerQuestionnaireInsuranceForm } from '../../../../../core/types/coworker-questionnaire-form';
import {
  QuestionnaireJoinDeclineAnswer,
  QuestionnaireYesNo,
} from '../../../../../core/types/coworker-questionnaire';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';

@Component({
  selector: 'app-questionnaire-insurance-elections',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CheckboxModule,
    IftaLabelModule,
    SelectModule,
    QuestionnaireFieldErrors,
  ],
  templateUrl: './questionnaire-insurance-elections.html',
})
export class QuestionnaireInsuranceElections {
  readonly form = input.required<CoworkerQuestionnaireInsuranceForm>();
  readonly yesNoOptions = input.required<
    ISelectOption<Exclude<QuestionnaireYesNo, null>>[]
  >();
  readonly insuranceChoiceOptions = input.required<
    ISelectOption<Exclude<QuestionnaireJoinDeclineAnswer, null>>[]
  >();

  protected readonly i18n = createQuestionnaireI18n();
}
