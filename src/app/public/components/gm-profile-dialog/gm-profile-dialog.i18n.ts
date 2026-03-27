import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonEmptyTranslations,
  OurTeamDialogTranslations,
} from '../../../core/types/common-i18n';
import {
  GmSessionsFormTranslations as AuthGmSessionsFormTranslations,
  SessionDifficultyTranslations,
  SessionFormTranslations,
} from '../../../core/types/common-i18n';

export function createGmProfileDialogI18n() {
  const dialogDict = translateObjectSignal('dialog', {}, { scope: 'ourTeam' });

  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
  const commonEmptyDict = translateObjectSignal('empty', {}, { scope: 'common' });

  const gmSessionsFormDict = translateObjectSignal('gmSessions.form', {}, { scope: 'auth' });
  const sessionFormDict = translateObjectSignal('sessionForm.form', {}, { scope: 'auth' });
  const sessionDifficultyDict = translateObjectSignal('sessionForm.difficulty', {}, { scope: 'auth' });

  const dialog = computed(() => dialogDict() as OurTeamDialogTranslations);
  const commonActions = computed(() => commonActionsDict() as CommonActionsTranslations);
  const commonEmpty = computed(() => commonEmptyDict() as CommonEmptyTranslations);

  const gmSessionsForm = computed(
    () => gmSessionsFormDict() as AuthGmSessionsFormTranslations,
  );
  const sessionForm = computed(() => sessionFormDict() as SessionFormTranslations);
  const difficulty = computed(
    () => sessionDifficultyDict() as SessionDifficultyTranslations,
  );

  return {
    dialog,
    commonActions,
    commonEmpty,
    gmSessionsForm,
    sessionForm,
    difficulty,
    playersLabel: (minPlayers: number, maxPlayers: number) =>
      `${minPlayers}-${maxPlayers}`,
    minAgeLabel: (minAge: number) => `${minAge}+`,
    yearsLabel: (years: number) => `${years} ${dialog().yearsSuffix}`,
  };
}