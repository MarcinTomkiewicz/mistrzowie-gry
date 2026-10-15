import {
  createCommonAppRolesI18n,
  createCommonEmptyI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  SessionSlotDifficultyTranslations,
  SessionSlotFallbacksTranslations,
} from '../../../core/types/i18n/sessions';

export function createEventSlotsI18n() {
  const { difficulty, commonFallbacks } = createScopedSectionsI18n<{
    difficulty: SessionSlotDifficultyTranslations;
    commonFallbacks: SessionSlotFallbacksTranslations;
  }>('sessions', {
    difficulty: 'slots.difficulty',
    commonFallbacks: 'slots.fallbacks',
  });

  return {
    difficulty,
    commonFallbacks,
    commonAppRoles: createCommonAppRolesI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
