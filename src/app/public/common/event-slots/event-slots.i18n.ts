import {
  createCommonAppRolesI18n,
  createCommonCtaI18n,
  createCommonEmptyI18n,
  createCommonValuesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  SessionSlotDifficultyTranslations,
  SessionSlotFallbacksTranslations,
} from '../../../core/types/i18n/sessions';

export function createEventSlotsI18n() {
  const { difficulty, commonFallbacks, activity } = createScopedSectionsI18n<{
    activity: Record<'presenter' | 'capacity', string>;
    difficulty: SessionSlotDifficultyTranslations;
    commonFallbacks: SessionSlotFallbacksTranslations;
  }>('sessions', {
    activity: 'slots.activity',
    difficulty: 'slots.difficulty',
    commonFallbacks: 'slots.fallbacks',
  });

  return {
    activity,
    difficulty,
    commonFallbacks,
    commonAppRoles: createCommonAppRolesI18n(),
    cta: createCommonCtaI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
