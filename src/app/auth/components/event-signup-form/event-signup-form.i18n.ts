import {
  ActionsCopy,
  BreadcrumbsCopy,
  ConfirmationCopy,
  CustomCopy,
  FormCopy,
  ModeCopy,
  SectionsCopy,
  StatesCopy,
  TemplateCopy,
  TitleDescriptionCopy,
  ToastCopy,
} from '../../../core/types/i18n/event-signup';
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
    toast,
  } = createScopedSectionsI18n<{
    seo: TitleDescriptionCopy;
    form: FormCopy;
    actions: ActionsCopy;
    confirmation: ConfirmationCopy;
    states: StatesCopy;
    mode: ModeCopy;
    template: TemplateCopy;
    custom: CustomCopy;
    sections: SectionsCopy;
    breadcrumbs: BreadcrumbsCopy;
    toast: ToastCopy;
  }>('eventSignup', {
    seo: 'form.seo',
    form: 'form.form',
    actions: 'form.actions',
    confirmation: 'form.confirmation',
    states: 'form.states',
    mode: 'form.mode',
    template: 'form.template',
    custom: 'form.custom',
    sections: 'form.sections',
    breadcrumbs: 'form.breadcrumbs',
    toast: 'form.toast',
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
