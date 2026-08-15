import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { ICoworkerQuestionnaireSensitiveMetadata } from '../../../../../core/interfaces/i-coworker-questionnaire';
import { ISelectOption } from '../../../../../core/interfaces/i-select-option';
import { CoworkerQuestionnairePersonalForm } from '../../../../../core/types/coworker-questionnaire-form';
import {
  QuestionnaireIdentificationBasis,
  QuestionnaireIdentityDocumentKind,
} from '../../../../../core/types/coworker-questionnaire';
import {
  CITIZENSHIP_OPTIONS,
  isCitizenshipCatalogValue,
} from '../../../../../core/utils/citizenship-options';
import { normalizeText } from '../../../../../core/utils/normalize-text';
import { QuestionnaireCatalogAutocomplete } from '../questionnaire-catalog-autocomplete';
import { QuestionnaireChoiceField } from '../questionnaire-choice-field';
import { QuestionnaireFieldErrors } from '../questionnaire-field-errors';
import { createQuestionnaireI18n } from '../questionnaire.i18n';
import { QuestionnaireSensitiveField } from '../questionnaire-sensitive-field/questionnaire-sensitive-field';

@Component({
  selector: 'app-questionnaire-personal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IftaLabelModule,
    InputTextModule,
    MessageModule,
    QuestionnaireCatalogAutocomplete,
    QuestionnaireChoiceField,
    QuestionnaireFieldErrors,
    QuestionnaireSensitiveField,
  ],
  templateUrl: './questionnaire-personal.html',
})
export class QuestionnairePersonal {
  readonly form = input.required<CoworkerQuestionnairePersonalForm>();
  readonly sensitive =
    input.required<ICoworkerQuestionnaireSensitiveMetadata>();

  protected readonly i18n = createQuestionnaireI18n();
  protected readonly citizenshipOptions = CITIZENSHIP_OPTIONS;
  protected readonly identificationBasisOptions = computed<
    ISelectOption<Exclude<QuestionnaireIdentificationBasis, null>>[]
  >(() => [
    { value: 'pesel', label: this.i18n.commonLabels().pesel },
    {
      value: 'identity_document',
      label: this.i18n.options().identityDocument,
    },
  ]);
  protected readonly identityDocumentKindOptions = computed<
    ISelectOption<Exclude<QuestionnaireIdentityDocumentKind, null>>[]
  >(() => [
    { value: 'id_card', label: this.i18n.options().idCard },
    { value: 'passport', label: this.i18n.options().passport },
    { value: 'other', label: this.i18n.options().otherDocument },
  ]);

  protected unrecognizedCitizenship(): string | null {
    const value = normalizeText(this.form().controls.citizenship.value);
    return value !== null && !isCitizenshipCatalogValue(value) ? value : null;
  }
}
