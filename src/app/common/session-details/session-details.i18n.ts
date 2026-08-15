import {
  createCommonAppRolesI18n,
  createCommonEmptyI18n,
  createCommonLabelsI18n,
  createCommonValuesI18n,
} from '../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../core/translations/scoped.i18n';
import {
  SessionFormTranslations,
  SessionListLabelsTranslations,
  SessionSlotDifficultyTranslations,
  SessionSlotFallbacksTranslations,
} from '../../core/types/i18n/sessions';

export function createSessionDetailsI18n() {
  const {
    sessionForm,
    difficulty,
    list,
    commonFallbacks,
  } = createScopedSectionsI18n<{
    sessionForm: SessionFormTranslations;
    difficulty: SessionSlotDifficultyTranslations;
    list: SessionListLabelsTranslations;
    commonFallbacks: SessionSlotFallbacksTranslations;
  }>('sessions', {
    sessionForm: 'form',
    difficulty: 'slots.difficulty',
    list: 'list',
    commonFallbacks: 'slots.fallbacks',
  });

  return {
    sessionForm,
    difficulty,
    list,
    commonFallbacks,
    commonAppRoles: createCommonAppRolesI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
