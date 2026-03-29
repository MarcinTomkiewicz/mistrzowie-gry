import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';
import { EventSlotsCommonFallbacksTranslations, EventSlotsDifficultyTranslations, EventSlotsLabelsTranslations } from '../../../core/types/common-i18n';


export function createEventSlotsI18n() {
  const labelsDict = translateObjectSignal('eventSlots.labels', {}, { scope: 'auth' });
  const difficultyDict = translateObjectSignal('eventSlots.difficulty', {}, { scope: 'auth' });
  const commonFallbacksDict = translateObjectSignal('fallbacks', {}, { scope: 'common' });

  const labels = computed(() => labelsDict() as EventSlotsLabelsTranslations);
  const difficulty = computed(() => difficultyDict() as EventSlotsDifficultyTranslations);
  const commonFallbacks = computed(
    () => commonFallbacksDict() as EventSlotsCommonFallbacksTranslations,
  );

  return {
    labels,
    difficulty,
    commonFallbacks,
  };
}