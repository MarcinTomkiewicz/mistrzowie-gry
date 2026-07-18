import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';

import {
  CoworkerCorrespondenceAddressForm,
  CoworkerQuestionnaireAddressForm,
} from '../../../../../core/types/coworker-questionnaire-form';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';
import { QuestionnaireAddressFields } from './questionnaire-address-fields';

@Component({
  selector: 'app-questionnaire-addresses',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CheckboxModule,
    IftaLabelModule,
    InputTextModule,
    QuestionnaireAddressFields,
    QuestionnaireFieldErrors,
  ],
  templateUrl: './questionnaire-addresses.html',
})
export class QuestionnaireAddresses {
  readonly registeredAddress =
    input.required<CoworkerQuestionnaireAddressForm>();
  readonly correspondenceAddress =
    input.required<CoworkerCorrespondenceAddressForm>();

  protected readonly i18n = createQuestionnaireI18n();
}
