import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

import { ICoworkerQuestionnaireSensitiveMetadata } from '../../../../../core/interfaces/i-coworker-questionnaire';
import { CoworkerQuestionnairePaymentForm } from '../../../../../core/types/coworker-questionnaire-form';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';
import { QuestionnaireSensitiveField } from '../questionnaire-sensitive-field/questionnaire-sensitive-field';

@Component({
  selector: 'app-questionnaire-payment',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    QuestionnaireFieldErrors,
    QuestionnaireSensitiveField,
  ],
  templateUrl: './questionnaire-payment.html',
})
export class QuestionnairePayment {
  readonly form = input.required<CoworkerQuestionnairePaymentForm>();
  readonly sensitive =
    input.required<ICoworkerQuestionnaireSensitiveMetadata>();

  protected readonly i18n = createQuestionnaireI18n();
}
