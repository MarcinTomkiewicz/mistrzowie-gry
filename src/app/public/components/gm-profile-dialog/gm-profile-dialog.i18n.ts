import { computed } from '@angular/core';

import {
  OurTeamDialogTranslations,
} from '../../../core/types/i18n/our-team';
import {
  SessionDifficultyTranslations,
  SessionFormTranslations,
  SessionListLabelsTranslations,
} from '../../../core/types/i18n/sessions';
import {
  createCommonActionsI18n,
  createCommonEmptyI18n,
} from '../../../core/translations/common.i18n';
import {
  createScopedObjectI18n,
  createScopedSectionsI18n,
} from '../../../core/translations/scoped.i18n';

export function createGmProfileDialogI18n() {
  const dialog = createScopedObjectI18n<OurTeamDialogTranslations>(
    'ourTeam',
    'dialog',
  );
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
  const commonEmpty = createCommonEmptyI18n();

  return {
    dialog,
    commonActions,
    commonEmpty,
    list,
    sessionForm,
    difficulty,
    playersLabel: (minPlayers: number, maxPlayers: number) =>
      `${minPlayers}-${maxPlayers}`,
    minAgeLabel: (minAge: number) => `${minAge}+`,
    yearsLabel: (years: number) => `${years} ${dialog().yearsSuffix}`,
  };
}
