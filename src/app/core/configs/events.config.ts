export const EVENT_SLUGS = {
  chaoticThursdays: 'chaotyczne-czwartki',
} as const;

export type EventSlug = (typeof EVENT_SLUGS)[keyof typeof EVENT_SLUGS];

export const EVENT_KEYS = {
  chaoticThursdays: 'chaotic-thursdays',
} as const;

export function isPublicEventSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && !value.startsWith('stf-');
}

export function buildPublicEventPath(
  eventKey: string,
  editionSlug: string,
): string {
  return `/wydarzenia/${encodeURIComponent(eventKey)}/${encodeURIComponent(editionSlug)}`;
}
