import { Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { TranslocoService } from '@jsverse/transloco';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import {
  CoworkerCorrespondenceAddressForm,
  CoworkerQuestionnaireAddressForm,
} from '../../../../../core/types/coworker-questionnaire-form';
import { buildCountryOptions } from '../../../../../core/utils/country-options';
import { QuestionnaireCatalogAutocomplete } from '../questionnaire-catalog-autocomplete';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';

@Component({
  selector: 'app-questionnaire-address-fields',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    MessageModule,
    QuestionnaireCatalogAutocomplete,
    QuestionnaireFieldErrors,
  ],
  templateUrl: './questionnaire-address-fields.html',
})
export class QuestionnaireAddressFields {
  readonly form = input.required<
    CoworkerQuestionnaireAddressForm | CoworkerCorrespondenceAddressForm
  >();
  readonly idPrefix = input.required<string>();
  readonly fieldPathPrefix = input.required<string>();

  private readonly transloco = inject(TranslocoService);

  protected readonly i18n = createQuestionnaireI18n();
  protected readonly countryOptions = buildCountryOptions(
    this.transloco.getActiveLang(),
  );

  protected fieldId(field: string): string {
    return `${this.idPrefix()}-${field}`;
  }

  protected fieldPath(field: string): string {
    return `${this.fieldPathPrefix()}.${field}`;
  }

  protected errorId(field: string): string {
    return `${this.fieldId(field)}-error`;
  }
}
