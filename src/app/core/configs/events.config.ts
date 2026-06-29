export const EVENT_SLUGS = {
  chaoticThursdays: 'chaotyczne-czwartki',
} as const;

export type EventSlug = (typeof EVENT_SLUGS)[keyof typeof EVENT_SLUGS];
