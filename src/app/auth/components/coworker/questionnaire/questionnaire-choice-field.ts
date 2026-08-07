import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { RadioButtonModule } from 'primeng/radiobutton';

import { ISelectOption } from '../../../../core/interfaces/i-select-option';
import type {
  QuestionnaireChoiceControl,
  QuestionnaireChoiceValue,
} from '../../../../core/types/coworker-questionnaire-form';
import { QuestionnaireFieldErrors } from './questionnaire-field-errors';

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
