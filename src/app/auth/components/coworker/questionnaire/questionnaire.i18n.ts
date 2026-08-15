import {
  createCommonActionsI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
} from '../../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../../core/translations/scoped.i18n';
import {
  QuestionnaireActionsTranslations,
  QuestionnaireErrorsTranslations,
  QuestionnaireFieldsTranslations,
  QuestionnaireOptionsTranslations,
  QuestionnairePageTranslations,
  QuestionnaireSectionsTranslations,
  QuestionnaireSensitiveTranslations,
  QuestionnaireStatusTranslations,
  QuestionnaireToastTranslations,
} from '../../../../core/types/i18n/coworker-questionnaire';

export const COWORKER_QUESTIONNAIRE_SCOPE = 'coworkerQuestionnaire';

export function createQuestionnaireI18n() {
  const sections = createScopedSectionsI18n<{
    page: QuestionnairePageTranslations;
    sections: QuestionnaireSectionsTranslations;
    fields: QuestionnaireFieldsTranslations;
    options: QuestionnaireOptionsTranslations;
    sensitive: QuestionnaireSensitiveTranslations;
    actions: QuestionnaireActionsTranslations;
    status: QuestionnaireStatusTranslations;
    errors: QuestionnaireErrorsTranslations;
    toast: QuestionnaireToastTranslations;
  }>(COWORKER_QUESTIONNAIRE_SCOPE, {
    page: 'page',
    sections: 'sections',
    fields: 'fields',
    options: 'options',
    sensitive: 'sensitive',
    actions: 'actions',
    status: 'status',
    errors: 'errors',
    toast: 'toast',
  });

  return {
    ...sections,
    commonActions: createCommonActionsI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonStatus: createCommonStatusI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
