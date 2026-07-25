import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { RadioButtonModule } from 'primeng/radiobutton';

import { ISelectOption } from '../../../../core/interfaces/i-select-option';
import {
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
  QuestionnaireJoinDeclineAnswer,
  QuestionnaireYesNo,
} from '../../../../core/types/coworker-questionnaire';
import { QuestionnaireFieldErrors } from './questionnaire-field-errors';

type QuestionnaireChoiceValue = Exclude<
  | QuestionnaireIdentificationBasis
  | QuestionnaireIdentityDocumentKind
  | QuestionnaireJoinDeclineAnswer
  | QuestionnaireYesNo,
  null
>;

type QuestionnaireChoiceControl =
  | FormControl<QuestionnaireIdentificationBasis>
  | FormControl<QuestionnaireIdentityDocumentKind>
  | FormControl<QuestionnaireJoinDeclineAnswer>
  | FormControl<QuestionnaireYesNo>;

@Component({
  selector: 'app-questionnaire-choice-field',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RadioButtonModule,
    QuestionnaireFieldErrors,
  ],
  templateUrl: './questionnaire-choice-field.html',
})
export class QuestionnaireChoiceField {
  readonly control = input.required<QuestionnaireChoiceControl>();
  readonly fieldPath = input.required<string>();
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly options =
    input.required<readonly ISelectOption<QuestionnaireChoiceValue>[]>();
  readonly stacked = input(false);

  protected readonly errorId = computed(() => `${this.inputId()}-error`);
  protected readonly labelId = computed(() => `${this.inputId()}-label`);

  protected optionInputId(value: QuestionnaireChoiceValue): string {
    return `${this.inputId()}-${value}`;
  }
}
