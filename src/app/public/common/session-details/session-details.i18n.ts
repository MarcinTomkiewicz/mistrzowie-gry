import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  SessionDetailsLabelsTranslations,
  SessionFormTranslations,
  SessionListLabelsTranslations,
  SessionSlotDifficultyTranslations,
  SessionSlotFallbacksTranslations,
  SessionSlotLabelsTranslations,
} from '../../../core/types/i18n/sessions';

export function createSessionDetailsI18n() {
  const {
    sessionForm,
    difficulty,
    list,
    eventSlotsLabels,
    commonFallbacks,
    detailsLabels,
  } = createScopedSectionsI18n<{
    sessionForm: SessionFormTranslations;
    difficulty: SessionSlotDifficultyTranslations;
    list: SessionListLabelsTranslations;
    eventSlotsLabels: SessionSlotLabelsTranslations;
    commonFallbacks: SessionSlotFallbacksTranslations;
    detailsLabels: SessionDetailsLabelsTranslations;
  }>('sessions', {
    sessionForm: 'form',
    difficulty: 'slots.difficulty',
    list: 'list',
    eventSlotsLabels: 'slots.labels',
    commonFallbacks: 'slots.fallbacks',
    detailsLabels: 'details.labels',
  });

  return {
    detailsLabels,
    sessionForm,
    difficulty,
    list,
    eventSlotsLabels,
    commonFallbacks,
  };
}
