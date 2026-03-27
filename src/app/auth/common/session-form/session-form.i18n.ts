import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonFormTranslations,
  SessionDifficultyTranslations,
  SessionErrorsTranslations,
  SessionFormTranslations,
} from '../../../core/types/common-i18n';

export function createSessionFormI18n() {
  const commonActionsDict = translateObjectSignal('actions', {}, { scope: 'common' });
  const commonFormDict = translateObjectSignal('form', {}, { scope: 'common' });

  const sessionFormDict = translateObjectSignal('sessionForm.form', {}, { scope: 'auth' });
  const sessionDifficultyDict = translateObjectSignal(
    'sessionForm.difficulty',
    {},
    { scope: 'auth' },
  );
  const sessionErrorsDict = translateObjectSignal('sessionForm.errors', {}, { scope: 'auth' });

  const commonActions = computed(
    () => commonActionsDict() as CommonActionsTranslations,
  );
  const commonForm = computed(() => commonFormDict() as CommonFormTranslations);

  const form = computed(() => sessionFormDict() as SessionFormTranslations);
  const difficulty = computed(
    () => sessionDifficultyDict() as SessionDifficultyTranslations,
  );
  const errors = computed(() => sessionErrorsDict() as SessionErrorsTranslations);

  return {
    commonActions,
    commonForm,
    form,
    difficulty,
    errors,
  };
}