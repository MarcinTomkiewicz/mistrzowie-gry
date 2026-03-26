import { computed } from '@angular/core';
import { translateObjectSignal, translateSignal } from '@jsverse/transloco';
import { CommonActionsTranslations, CommonFormTranslations } from '../../../core/types/common-i18n';



export function createSessionFormI18n() {
  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
  const commonFormDict = translateObjectSignal('form', {}, { scope: 'common' });

  const titleLabel = translateSignal('sessionForm.form.titleLabel', {}, { scope: 'auth' });
  const systemLabel = translateSignal('sessionForm.form.systemLabel', {}, { scope: 'auth' });
  const descriptionLabel = translateSignal(
    'sessionForm.form.descriptionLabel',
    {},
    { scope: 'auth' },
  );
  const difficultyLabel = translateSignal(
    'sessionForm.form.difficultyLabel',
    {},
    { scope: 'auth' },
  );
  const minPlayersLabel = translateSignal(
    'sessionForm.form.minPlayersLabel',
    {},
    { scope: 'auth' },
  );
  const maxPlayersLabel = translateSignal(
    'sessionForm.form.maxPlayersLabel',
    {},
    { scope: 'auth' },
  );
  const minAgeLabel = translateSignal('sessionForm.form.minAgeLabel', {}, { scope: 'auth' });
  const sortOrderLabel = translateSignal(
    'sessionForm.form.sortOrderLabel',
    {},
    { scope: 'auth' },
  );
  const stylesLabel = translateSignal('sessionForm.form.stylesLabel', {}, { scope: 'auth' });
  const triggersLabel = translateSignal('sessionForm.form.triggersLabel', {}, { scope: 'auth' });

  const playersRangeLabel = translateSignal(
    'sessionForm.form.playersRangeLabel',
    {},
    { scope: 'auth' },
  );
  const minAgeRangeLabel = translateSignal(
    'sessionForm.form.minAgeRangeLabel',
    {},
    { scope: 'auth' },
  );
  const sortOrderRangeLabel = translateSignal(
    'sessionForm.form.sortOrderRangeLabel',
    {},
    { scope: 'auth' },
  );

  const beginnerDifficultyLabel = translateSignal(
    'sessionForm.difficulty.beginner',
    {},
    { scope: 'auth' },
  );
  const intermediateDifficultyLabel = translateSignal(
    'sessionForm.difficulty.intermediate',
    {},
    { scope: 'auth' },
  );
  const advancedDifficultyLabel = translateSignal(
    'sessionForm.difficulty.advanced',
    {},
    { scope: 'auth' },
  );

  const invalidPlayersRangeError = translateSignal(
    'sessionForm.errors.invalidPlayersRange',
    {},
    { scope: 'auth' },
  );

  const commonActions = computed(
    () => commonActionsDict() as CommonActionsTranslations,
  );
  const commonForm = computed(() => commonFormDict() as CommonFormTranslations);

  return {
    commonActions,
    commonForm,
    titleLabel,
    systemLabel,
    descriptionLabel,
    difficultyLabel,
    minPlayersLabel,
    maxPlayersLabel,
    minAgeLabel,
    sortOrderLabel,
    stylesLabel,
    triggersLabel,
    playersRangeLabel,
    minAgeRangeLabel,
    sortOrderRangeLabel,
    beginnerDifficultyLabel,
    intermediateDifficultyLabel,
    advancedDifficultyLabel,
    invalidPlayersRangeError,
  };
}