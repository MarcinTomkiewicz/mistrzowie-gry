import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonQuestionsTranslations,
  CommonStatusTranslations,
  EventSignupFormActionsTranslations,
  EventSignupFormBreadcrumbTranslations,
  EventSignupFormConfirmationTranslations,
  EventSignupFormCustomTranslations,
  EventSignupFormModeTranslations,
  EventSignupFormNavigationTranslations,
  EventSignupFormSectionsTranslations,
  EventSignupFormStatesTranslations,
  EventSignupFormTemplateTranslations,
  EventSignupFormToastTranslations,
  EventSignupFormTranslations,
  SessionDifficultyTranslations,
  SessionFormTranslations,
} from '../../../core/types/common-i18n';

export function createEventSignupFormI18n() {
  const formDict = translateObjectSignal(
    'eventSignupForm.form',
    {},
    { scope: 'auth' },
  );
  const actionsDict = translateObjectSignal(
    'eventSignupForm.actions',
    {},
    { scope: 'auth' },
  );
  const confirmationDict = translateObjectSignal(
    'eventSignupForm.confirmation',
    {},
    { scope: 'auth' },
  );
  const statesDict = translateObjectSignal(
    'eventSignupForm.states',
    {},
    { scope: 'auth' },
  );
  const modeDict = translateObjectSignal(
    'eventSignupForm.mode',
    {},
    { scope: 'auth' },
  );
  const templateDict = translateObjectSignal(
    'eventSignupForm.template',
    {},
    { scope: 'auth' },
  );
  const customDict = translateObjectSignal(
    'eventSignupForm.custom',
    {},
    { scope: 'auth' },
  );
  const sectionsDict = translateObjectSignal(
    'eventSignupForm.sections',
    {},
    { scope: 'auth' },
  );
  const breadcrumbsDict = translateObjectSignal(
    'eventSignupForm.breadcrumbs',
    {},
    { scope: 'auth' },
  );
  const navigationDict = translateObjectSignal(
    'eventSignupForm.navigation',
    {},
    { scope: 'auth' },
  );
  const toastDict = translateObjectSignal(
    'eventSignupForm.toast',
    {},
    { scope: 'auth' },
  );

  const sessionFormDict = translateObjectSignal(
    'sessionForm.form',
    {},
    { scope: 'auth' },
  );
  const sessionDifficultyDict = translateObjectSignal(
    'sessionForm.difficulty',
    {},
    { scope: 'auth' },
  );

  const commonActionsDict = translateObjectSignal(
    'actions',
    {},
    { scope: 'common' },
  );
  const commonQuestionsDict = translateObjectSignal(
    'questions',
    {},
    { scope: 'common' },
  );
  const commonStatusDict = translateObjectSignal(
    'status',
    {},
    { scope: 'common' },
  );

  const form = computed(() => formDict() as EventSignupFormTranslations);
  const actions = computed(
    () => actionsDict() as EventSignupFormActionsTranslations,
  );
  const confirmation = computed(
    () => confirmationDict() as EventSignupFormConfirmationTranslations,
  );
  const states = computed(
    () => statesDict() as EventSignupFormStatesTranslations,
  );
  const mode = computed(() => modeDict() as EventSignupFormModeTranslations);
  const template = computed(
    () => templateDict() as EventSignupFormTemplateTranslations,
  );
  const custom = computed(
    () => customDict() as EventSignupFormCustomTranslations,
  );
  const sections = computed(
    () => sectionsDict() as EventSignupFormSectionsTranslations,
  );
  const breadcrumbs = computed(
    () => breadcrumbsDict() as EventSignupFormBreadcrumbTranslations,
  );
  const navigation = computed(
    () => navigationDict() as EventSignupFormNavigationTranslations,
  );
  const toast = computed(() => toastDict() as EventSignupFormToastTranslations);

  const sessionForm = computed(
    () => sessionFormDict() as SessionFormTranslations,
  );
  const difficulty = computed(
    () => sessionDifficultyDict() as SessionDifficultyTranslations,
  );

  const commonActions = computed(
    () => commonActionsDict() as CommonActionsTranslations,
  );
  const commonQuestions = computed(
    () => commonQuestionsDict() as CommonQuestionsTranslations,
  );
  const commonStatus = computed(
    () => commonStatusDict() as CommonStatusTranslations,
  );

  return {
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
    commonActions,
    commonQuestions,
    commonStatus,
    playersLabel: (minPlayers: number, maxPlayers: number) =>
      `${minPlayers}-${maxPlayers}`,
    minAgeLabel: (minAge: number) => `${minAge}+`,
  };
}
