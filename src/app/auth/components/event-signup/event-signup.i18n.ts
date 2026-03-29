import { computed } from '@angular/core';
import { translateObjectSignal } from '@jsverse/transloco';

import {
  CommonStatusTranslations,
} from '../../../core/types/common-i18n';

type EventSignupPageTranslations = {
  title: string;
  subtitle: string;
};

type EventSignupDetailsTranslations = {
  timeLabel: string;
  beginnersLabel: string;
  beginnersYes: string;
  beginnersNo: string;
};

type EventSignupOccurrencesTranslations = {
  title: string;
  subtitle: string;
};

type EventSignupEmptyTranslations = {
  title: string;
  description: string;
};

export function createEventSignupI18n() {
  const pageDict = translateObjectSignal('eventSignup.page', {}, { scope: 'auth' });
  const detailsDict = translateObjectSignal('eventSignup.details', {}, { scope: 'auth' });
  const occurrencesDict = translateObjectSignal('eventSignup.occurrences', {}, { scope: 'auth' });
  const emptyDict = translateObjectSignal('eventSignup.empty', {}, { scope: 'auth' });
  const commonStatusDict = translateObjectSignal('status', {}, { scope: 'common' });

  const page = computed(() => pageDict() as EventSignupPageTranslations);
  const details = computed(() => detailsDict() as EventSignupDetailsTranslations);
  const occurrences = computed(() => occurrencesDict() as EventSignupOccurrencesTranslations);
  const empty = computed(() => emptyDict() as EventSignupEmptyTranslations);
  const commonStatus = computed(() => commonStatusDict() as CommonStatusTranslations);

  return {
    page,
    details,
    occurrences,
    empty,
    commonStatus,
  };
}