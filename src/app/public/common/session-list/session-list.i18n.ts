import { computed } from '@angular/core';
import {
  createCommonQuestionsI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import { SessionConfirmationTranslations } from '../../../core/types/i18n/sessions';

export function createSessionListI18n() {
  const values = createCommonValuesI18n();
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
    values,
    dialog,
  };
}
