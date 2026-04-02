import { computed } from '@angular/core';
import { translateObjectSignal, translateSignal } from '@jsverse/transloco';

import {
  EventSlotsCommonFallbacksTranslations,
  EventSlotsDifficultyTranslations,
  EventSlotsLabelsTranslations,
  GmSessionsFormTranslations,
  SessionFormTranslations,
} from '../../../core/types/common-i18n';

export function createSessionDetailsI18n() {
  const sessionFormDict = translateObjectSignal(
    'sessionForm.form',
    {},
    { scope: 'auth' },
  );

  const difficultyDict = translateObjectSignal(
    'eventSlots.difficulty',
    {},
    { scope: 'auth' },
  );

  const gmSessionsFormDict = translateObjectSignal(
    'gmSessions.form',
    {},
    { scope: 'auth' },
  );

  const eventSlotsLabelsDict = translateObjectSignal(
    'eventSlots.labels',
    {},
    { scope: 'auth' },
  );

  const commonFallbacksDict = translateObjectSignal(
    'fallbacks',
    {},
    { scope: 'common' },
  );

  const descriptionLabel = translateSignal(
    'sessionForm.form.descriptionLabel',
    {},
    { scope: 'auth' },
  );

  const primaryInfoLabel = translateSignal(
    'sessionDetails.labels.primaryInfo',
    {},
    { scope: 'auth' },
  );

  const additionalInfoLabel = translateSignal(
    'sessionDetails.labels.additionalInfo',
    {},
    { scope: 'auth' },
  );

  const stylesLabel = translateSignal(
    'sessionForm.form.stylesLabel',
    {},
    { scope: 'auth' },
  );

  const triggersLabel = translateSignal(
    'sessionForm.form.triggersLabel',
    {},
    { scope: 'auth' },
  );

  const sessionForm = computed(() => sessionFormDict() as SessionFormTranslations);
  const difficulty = computed(
    () => difficultyDict() as EventSlotsDifficultyTranslations,
  );
  const gmSessionsForm = computed(
    () => gmSessionsFormDict() as GmSessionsFormTranslations,
  );
  const eventSlotsLabels = computed(
    () => eventSlotsLabelsDict() as EventSlotsLabelsTranslations,
  );
  const commonFallbacks = computed(
    () => commonFallbacksDict() as EventSlotsCommonFallbacksTranslations,
  );

  return {
    descriptionLabel,
    primaryInfoLabel,
    additionalInfoLabel,
    stylesLabel,
    triggersLabel,
    sessionForm,
    difficulty,
    gmSessionsForm,
    eventSlotsLabels,
    commonFallbacks,
  };
}
