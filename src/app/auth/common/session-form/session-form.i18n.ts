import {
  createCommonActionsI18n,
  createCommonFormI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  SessionDifficultyTranslations,
  SessionErrorsTranslations,
  SessionFormTranslations,
} from '../../../core/types/i18n/sessions';

export function createSessionFormI18n() {
  const commonActions = createCommonActionsI18n();
  const commonForm = createCommonFormI18n();
  const { form, difficulty, errors } = createScopedSectionsI18n<{
    form: SessionFormTranslations;
    difficulty: SessionDifficultyTranslations;
    errors: SessionErrorsTranslations;
  }>('sessions', {
    form: 'form',
    difficulty: 'difficulty',
    errors: 'errors',
  });

  return {
    commonActions,
    commonForm,
    form,
    difficulty,
    errors,
  };
}
