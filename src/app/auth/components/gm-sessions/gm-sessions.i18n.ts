import {
  GmSessionsActionsTranslations,
  GmSessionsEmptyTranslations,
  GmSessionsFormTranslations,
  GmSessionsToastTranslations,
  GmSessionsTranslations,
} from '../../../core/types/i18n/auth';
import {
  createCommonActionsI18n,
  createCommonStatusI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  SessionDifficultyTranslations,
  SessionFormTranslations,
  SessionListLabelsTranslations,
} from '../../../core/types/i18n/sessions';

export function createGmSessionsI18n() {
  const { gmSessions, actions, empty, form, toast } =
    createScopedSectionsI18n<{
      gmSessions: GmSessionsTranslations;
      actions: GmSessionsActionsTranslations;
      empty: GmSessionsEmptyTranslations;
      form: GmSessionsFormTranslations;
      toast: GmSessionsToastTranslations;
    }>('auth', {
      gmSessions: 'gmSessions',
      actions: 'gmSessions.actions',
      empty: 'gmSessions.empty',
      form: 'gmSessions.form',
      toast: 'gmSessions.toast',
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
  const commonStatus = createCommonStatusI18n();

  return {
    gmSessions,
    actions,
    empty,
    form,
    toast,
    sessionForm,
    difficulty,
    list,
    commonActions,
    commonStatus,
    playersLabel: (minPlayers: number, maxPlayers: number) =>
      `${minPlayers}-${maxPlayers}`,
    minAgeLabel: (minAge: number) => `${minAge}+`,
  };
}
