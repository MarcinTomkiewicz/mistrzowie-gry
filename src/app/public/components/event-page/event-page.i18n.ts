import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

import {
  createCommonActionsI18n,
  createCommonCtaI18n,
  createCommonErrorsI18n,
  createCommonFormI18n,
  createCommonLabelsI18n,
  createCommonStatusI18n,
  createCommonValuesI18n,
  createCommonAppRolesI18n,
} from '../../../core/translations/common.i18n';
import { createScopedObjectI18n } from '../../../core/translations/scoped.i18n';
import type {
  EventPageProgramTranslations,
  EventPageParticipantSignupTranslations,
  EventPageTranslations,
} from '../../../core/types/i18n/event-page';

export function createEventPageI18n() {
  const transloco = inject(TranslocoService);
  return {
    page: createScopedObjectI18n<EventPageTranslations>('eventPage', 'page'),
    program: createScopedObjectI18n<EventPageProgramTranslations>(
      'eventPage', 'program',
    ),
    signup: createScopedObjectI18n<EventPageParticipantSignupTranslations>(
      'eventPage', 'participantSignup',
    ),
    form: createCommonFormI18n(),
    actions: createCommonActionsI18n(),
    cta: createCommonCtaI18n(),
    remainingSessions: (count: number): string => transloco.translate<string>(
      'common.cta.showRemainingSessions', { count },
    ),
    remainingSeats: (count: number): string => transloco.translate<string>(
      'eventPage.participantSignup.remainingSeats', { count },
    ),
    errors: createCommonErrorsI18n(),
    labels: createCommonLabelsI18n(),
    status: createCommonStatusI18n(),
    values: createCommonValuesI18n(),
    roles: createCommonAppRolesI18n(),
  };
}
