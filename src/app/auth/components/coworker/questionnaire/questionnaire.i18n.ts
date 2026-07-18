import {
  createCommonActionsI18n,
  createCommonStatusI18n,
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
  }>('auth', {
    page: 'coworkerQuestionnaire.page',
    sections: 'coworkerQuestionnaire.sections',
    fields: 'coworkerQuestionnaire.fields',
    options: 'coworkerQuestionnaire.options',
    sensitive: 'coworkerQuestionnaire.sensitive',
    actions: 'coworkerQuestionnaire.actions',
    status: 'coworkerQuestionnaire.status',
    errors: 'coworkerQuestionnaire.errors',
    toast: 'coworkerQuestionnaire.toast',
  });

  return {
    ...sections,
    commonActions: createCommonActionsI18n(),
    commonStatus: createCommonStatusI18n(),
  };
}
