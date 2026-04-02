import { computed } from '@angular/core';
import {
  createCommonActionsI18n,
  createCommonQuestionsI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import { SessionConfirmationTranslations } from '../../../core/types/i18n/sessions';

export function createSessionListI18n() {
  const actions = createCommonActionsI18n();
  const commonQuestions = createCommonQuestionsI18n();
  const confirmation = createScopedObjectI18n<SessionConfirmationTranslations>(
    'sessions',
    'confirmation',
  );
  const dialog = computed(() => ({
    sure: commonQuestions().sure,
    deleteSession: confirmation().deleteSession,
  }));

  return {
    actions,
    dialog,
  };
}
