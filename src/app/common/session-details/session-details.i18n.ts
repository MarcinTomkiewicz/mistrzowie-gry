import {
  createCommonAppRolesI18n,
  createCommonEmptyI18n,
  createCommonLabelsI18n,
  createCommonValuesI18n,
} from '../../core/translations/common.i18n';
import { createScopedSectionsI18n } from '../../core/translations/scoped.i18n';
import {
  SessionFormTranslations,
  SessionEventCapacityTranslations,
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
    eventCapacity,
  } = createScopedSectionsI18n<{
    sessionForm: SessionFormTranslations;
    difficulty: SessionSlotDifficultyTranslations;
    list: SessionListLabelsTranslations;
    commonFallbacks: SessionSlotFallbacksTranslations;
    eventCapacity: SessionEventCapacityTranslations;
  }>('sessions', {
    sessionForm: 'form',
    difficulty: 'slots.difficulty',
    list: 'list',
    commonFallbacks: 'slots.fallbacks',
    eventCapacity: 'eventCapacity',
  });

  return {
    sessionForm,
    difficulty,
    list,
    commonFallbacks,
    eventCapacity,
    commonAppRoles: createCommonAppRolesI18n(),
    commonEmpty: createCommonEmptyI18n(),
    commonLabels: createCommonLabelsI18n(),
    commonValues: createCommonValuesI18n(),
  };
}
