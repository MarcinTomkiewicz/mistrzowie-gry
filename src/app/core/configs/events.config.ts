export const EVENT_SLUGS = {
  chaoticThursdays: 'chaotyczne-czwartki',
} as const;

export type EventSlug = (typeof EVENT_SLUGS)[keyof typeof EVENT_SLUGS];

export const EVENT_KEYS = {
  chaoticThursdays: 'chaotic-thursdays',
  pga: 'pga-x-nocne-retro-granie',
} as const;

// Frontend signup is released only for this Core; backend canSignup remains authoritative.
export const PUBLIC_EVENT_PARTICIPANT_SIGNUP_CORE_KEY = EVENT_KEYS.pga;

export const EVENT_PARTICIPANT_CONTACT_PHONES: Readonly<Partial<Record<string, string>>> = {
  [EVENT_KEYS.pga]: '792 314 240',
};

export const EVENT_CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK', 'SEK', 'NOK', 'DKK'] as const;
export const EVENT_PRICE_BASES = ['per_participant', 'per_session', 'per_group', 'per_event'] as const;

export const MAX_GLOBAL_EVENT_DATES = 732;

export function isPublicEventSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && !value.startsWith('stf-');
}

export function buildPublicEventPath(
  eventKey: string,
  editionSlug: string,
): string {
  return `/wydarzenia/${encodeURIComponent(eventKey)}/${encodeURIComponent(editionSlug)}`;
}
