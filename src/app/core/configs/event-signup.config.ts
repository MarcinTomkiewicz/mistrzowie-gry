import type { EventSlug } from './events.config';

export const EVENT_SIGNUP_SELECTION_ROUTE = '/auth/event-signup';

export function buildEventHostSignupRoute(
  eventSlug: EventSlug | string,
  occurrenceDate: string,
): string[] {
  return [
    '/auth',
    'event-signup',
    eventSlug,
    occurrenceDate,
    'signup',
  ];
}

export function buildEventHostSignupPath(
  eventSlug: EventSlug | string,
  occurrenceDate: string,
): string {
  return buildEventHostSignupRoute(eventSlug, occurrenceDate).join('/');
}
