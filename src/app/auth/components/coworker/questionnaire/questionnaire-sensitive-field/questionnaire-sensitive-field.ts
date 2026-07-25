import { Component, effect, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

import { BankAccountInput } from '../../../../../core/directives/bank-account-input/bank-account-input';
import { ICoworkerSensitiveFieldMetadata } from '../../../../../core/interfaces/i-coworker-questionnaire';
import { setControlEnabled } from '../../../../../core/utils/form-controls';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';

@Component({
  selector: 'app-questionnaire-sensitive-field',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonModule,
    IftaLabelModule,
    InputTextModule,
    BankAccountInput,
    QuestionnaireFieldErrors,
  ],
  templateUrl: './questionnaire-sensitive-field.html',
})
export class QuestionnaireSensitiveField {
  readonly control = input.required<FormControl<string>>();
  readonly metadata = input.required<ICoworkerSensitiveFieldMetadata>();
  readonly inputId = input.required<string>();
  readonly fieldPath = input.required<string>();
  readonly label = input.required<string>();
  readonly autocomplete = input('off');
  readonly bankAccount = input(false);

  protected readonly i18n = createQuestionnaireI18n();
  protected readonly replacementMode = signal(false);

  private readonly syncMetadataEffect = effect(() => {
    const configured = this.metadata().configured;
    const control = this.control();

    this.replacementMode.set(!configured);
    control.setValue('', { emitEvent: false });
    setControlEnabled(control, !configured);
  });

  protected setReplacementMode(replace: boolean): void {
    if (!this.metadata().configured) {
      return;
    }

    this.replacementMode.set(replace);
    if (!replace) {
      this.control().setValue('', { emitEvent: false });
    }
    setControlEnabled(this.control(), replace);
  }

  protected errorId(): string {
    return `${this.inputId()}-error`;
  }
}
