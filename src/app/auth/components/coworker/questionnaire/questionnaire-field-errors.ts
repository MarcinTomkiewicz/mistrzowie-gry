import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-questionnaire-field-errors',
  standalone: true,
  templateUrl: './questionnaire-field-errors.html',
})
export class QuestionnaireFieldErrors {
  readonly control = input.required<AbstractControl>();
  readonly errorId = input.required<string>();

  protected errorMessage(): string | null {
    const message = this.control().errors?.['server'];
    return typeof message === 'string' ? message : null;
  }
}
