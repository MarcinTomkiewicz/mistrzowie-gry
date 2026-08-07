import type { ICoworkerDocumentPortal } from '../interfaces/i-coworker-onboarding';

export type CoworkerPortalState =
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly portal: ICoworkerDocumentPortal }
  | { readonly status: 'error' };
