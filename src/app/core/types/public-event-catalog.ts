import type { IPublicEventCatalogItem } from '../interfaces/i-event-catalog';

export type PublicEventCatalogState =
  | { kind: 'loading' | 'error' }
  | { kind: 'ready'; items: readonly IPublicEventCatalogItem[] };
