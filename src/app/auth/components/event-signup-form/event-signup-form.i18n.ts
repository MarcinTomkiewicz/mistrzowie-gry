import {
  EventSignupFormActionsTranslations,
  EventSignupFormBreadcrumbTranslations,
  EventSignupFormConfirmationTranslations,
  EventSignupFormCustomTranslations,
  EventSignupFormModeTranslations,
  EventSignupFormNavigationTranslations,
  EventSignupFormSeoTranslations,
  EventSignupFormSectionsTranslations,
  EventSignupFormStatesTranslations,
  EventSignupFormTemplateTranslations,
  EventSignupFormToastTranslations,
  EventSignupFormTranslations,
} from '../../../core/types/i18n/auth';
import {
  createCommonActionsI18n,
  createCommonQuestionsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  SessionDifficultyTranslations,
  SessionFormTranslations,
  SessionListLabelsTranslations,
} from '../../../core/types/i18n/sessions';

export function createEventSignupFormI18n() {
  const {
    seo,
    form,
    actions,
    confirmation,
    states,
    mode,
    template,
    custom,
    sections,
    breadcrumbs,
    navigation,
    toast,
  } = createScopedSectionsI18n<{
    seo: EventSignupFormSeoTranslations;
    form: EventSignupFormTranslations;
    actions: EventSignupFormActionsTranslations;
    confirmation: EventSignupFormConfirmationTranslations;
    states: EventSignupFormStatesTranslations;
    mode: EventSignupFormModeTranslations;
    template: EventSignupFormTemplateTranslations;
    custom: EventSignupFormCustomTranslations;
    sections: EventSignupFormSectionsTranslations;
    breadcrumbs: EventSignupFormBreadcrumbTranslations;
    navigation: EventSignupFormNavigationTranslations;
    toast: EventSignupFormToastTranslations;
  }>('auth', {
    seo: 'eventSignupForm.seo',
    form: 'eventSignupForm.form',
    actions: 'eventSignupForm.actions',
    confirmation: 'eventSignupForm.confirmation',
    states: 'eventSignupForm.states',
    mode: 'eventSignupForm.mode',
    template: 'eventSignupForm.template',
    custom: 'eventSignupForm.custom',
    sections: 'eventSignupForm.sections',
    breadcrumbs: 'eventSignupForm.breadcrumbs',
    navigation: 'eventSignupForm.navigation',
    toast: 'eventSignupForm.toast',
  });

  const { sessionForm, difficulty, list } = createScopedSectionsI18n<{
    sessionForm: SessionFormTranslations;
    difficulty: SessionDifficultyTranslations;
    list: SessionListLabelsTranslations;
  }>('sessions', {
    sessionForm: 'form',
    difficulty: 'difficulty',
    list: 'list',
  });
  const commonActions = createCommonActionsI18n();
  const commonQuestions = createCommonQuestionsI18n();
  const commonStatus = createCommonStatusI18n();

  return {
    seo,
    form,
    actions,
    confirmation,
    states,
    mode,
    template,
    custom,
    sections,
    breadcrumbs,
    navigation,
    toast,
    sessionForm,
    difficulty,
    list,
    commonActions,
    commonQuestions,
    commonStatus,
    playersLabel: (minPlayers: number, maxPlayers: number) =>
      `${minPlayers}-${maxPlayers}`,
    minAgeLabel: (minAge: number) => `${minAge}+`,
  };
}
