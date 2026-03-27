import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonStatusTranslations,
  GmSessionsActionsTranslations,
  GmSessionsEmptyTranslations,
  GmSessionsFormTranslations,
  GmSessionsToastTranslations,
  GmSessionsTranslations,
  SessionDifficultyTranslations,
  SessionFormTranslations,
} from '../../../core/types/common-i18n';

export function createGmSessionsI18n() {
  const gmSessionsDict = translateObjectSignal('gmSessions', {}, { scope: 'auth' });
  const gmSessionsActionsDict = translateObjectSignal('gmSessions.actions', {}, { scope: 'auth' });
  const gmSessionsEmptyDict = translateObjectSignal('gmSessions.empty', {}, { scope: 'auth' });
  const gmSessionsFormDict = translateObjectSignal('gmSessions.form', {}, { scope: 'auth' });
  const gmSessionsToastDict = translateObjectSignal('gmSessions.toast', {}, { scope: 'auth' });

  const sessionFormDict = translateObjectSignal('sessionForm.form', {}, { scope: 'auth' });
  const sessionDifficultyDict = translateObjectSignal('sessionForm.difficulty', {}, { scope: 'auth' });

  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
  const commonStatusDict = translateObjectSignal('status', {}, { scope: 'common' });

  const gmSessions = computed(() => gmSessionsDict() as GmSessionsTranslations);
  const actions = computed(() => gmSessionsActionsDict() as GmSessionsActionsTranslations);
  const empty = computed(() => gmSessionsEmptyDict() as GmSessionsEmptyTranslations);
  const form = computed(() => gmSessionsFormDict() as GmSessionsFormTranslations);
  const toast = computed(() => gmSessionsToastDict() as GmSessionsToastTranslations);

  const sessionForm = computed(() => sessionFormDict() as SessionFormTranslations);
  const difficulty = computed(() => sessionDifficultyDict() as SessionDifficultyTranslations);

  const commonActions = computed(() => commonActionsDict() as CommonActionsTranslations);
  const commonStatus = computed(() => commonStatusDict() as CommonStatusTranslations);

  return {
    gmSessions,
    actions,
    empty,
    form,
    toast,
    sessionForm,
    difficulty,
    commonActions,
    commonStatus,
    playersLabel: (minPlayers: number, maxPlayers: number) =>
      `${minPlayers}-${maxPlayers}`,
    minAgeLabel: (minAge: number) => `${minAge}+`,
  };
}