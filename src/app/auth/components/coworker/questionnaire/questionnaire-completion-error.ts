import { EdgeFunctionError } from '../../../../core/types/edge-function-error';
import type { CoworkerQuestionnaireForm } from '../../../../core/types/coworker-questionnaire-form';
import type { QuestionnaireErrorsTranslations } from '../../../../core/types/i18n/coworker-questionnaire';
import { isCitizenshipCatalogValue } from '../../../../core/utils/citizenship-options';

export function createQuestionnaireCompletionError(
  form: CoworkerQuestionnaireForm,
  translations: QuestionnaireErrorsTranslations,
): EdgeFunctionError | null {
  const fieldErrors: Record<string, string> = {};

  if (
    !isCitizenshipCatalogValue(
      form.controls.personal.controls.citizenship.value,
    )
  ) {
    fieldErrors['data.personal.citizenship'] =
      translations.citizenshipCatalogRequired;
  }
  if (!form.controls.finalDeclarationAccepted.value) {
    fieldErrors['finalDeclaration.accepted'] =
      translations.finalDeclarationAccepted;
  }

  return Object.keys(fieldErrors).length > 0
    ? new EdgeFunctionError(
        400,
        'VALIDATION_FAILED',
        translations.validationDescription,
        fieldErrors,
        null,
      )
    : null;
}
