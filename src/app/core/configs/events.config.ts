export const EVENT_SLUGS = {
  chaoticThursdays: 'chaotyczne-czwartki',
} as const;

export type EventSlug = (typeof EVENT_SLUGS)[keyof typeof EVENT_SLUGS];

export const EVENT_KEYS = {
  chaoticThursdays: 'chaotic-thursdays',
} as const;

// Release stays closed until EFS-014/023 and EFS-022/037 are accepted.
export const PUBLIC_EVENT_PARTICIPANT_SIGNUP_ENABLED = false;

export const EVENT_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'SEK', 'NOK', 'DKK'] as const;
export const EVENT_PRICE_BASES = ['per_participant', 'per_session', 'per_group', 'per_event'] as const;

export function isPublicEventSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && !value.startsWith('stf-');
}

export function buildPublicEventPath(
  eventKey: string,
  editionSlug: string,
): string {
  return `/wydarzenia/${encodeURIComponent(eventKey)}/${encodeURIComponent(editionSlug)}`;
}
