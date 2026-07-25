import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

import { ISelectOption } from '../../../../../core/interfaces/i-select-option';
import { CoworkerQuestionnaireInsuranceForm } from '../../../../../core/types/coworker-questionnaire-form';
import { QuestionnaireYesNo } from '../../../../../core/types/coworker-questionnaire';
import { QuestionnaireChoiceField } from '../questionnaire-choice-field';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';

@Component({
  selector: 'app-questionnaire-insurance-employment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    QuestionnaireChoiceField,
    QuestionnaireFieldErrors,
  ],
  templateUrl: './questionnaire-insurance-employment.html',
})
export class QuestionnaireInsuranceEmployment {
  readonly form = input.required<CoworkerQuestionnaireInsuranceForm>();
  readonly yesNoOptions = input.required<
    ISelectOption<Exclude<QuestionnaireYesNo, null>>[]
  >();

  protected readonly i18n = createQuestionnaireI18n();
}
