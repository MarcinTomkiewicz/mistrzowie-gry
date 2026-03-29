import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonActionsTranslations,
  CommonQuestionsTranslations,
} from '../../../core/types/common-i18n';

export function createSessionListI18n() {
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

  const actions = computed(
    () => commonActionsDict() as CommonActionsTranslations,
  );
  const questions = computed(
    () => commonQuestionsDict() as CommonQuestionsTranslations,
  );

  return {
    actions,
    questions,
  };
}
