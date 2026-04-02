import { createScopedSectionsI18n } from '../../../core/translations/scoped.i18n';
import {
  SessionSlotDifficultyTranslations,
  SessionSlotFallbacksTranslations,
  SessionSlotLabelsTranslations,
} from '../../../core/types/i18n/sessions';

export function createEventSlotsI18n() {
  const { labels, difficulty, commonFallbacks } = createScopedSectionsI18n<{
    labels: SessionSlotLabelsTranslations;
    difficulty: SessionSlotDifficultyTranslations;
    commonFallbacks: SessionSlotFallbacksTranslations;
  }>('sessions', {
    labels: 'slots.labels',
    difficulty: 'slots.difficulty',
    commonFallbacks: 'slots.fallbacks',
  });

  return {
    labels,
    difficulty,
    commonFallbacks,
  };
}
