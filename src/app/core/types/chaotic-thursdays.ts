export type ChaoticThursdaysLoadError =
  | { kind: 'core-not-found' }
  | { kind: 'no-editions' }
  | {
      kind: 'invalid-default';
      defaultEventId: string | null;
    }
  | {
      kind: 'grouped-rpc';
      cause: unknown;
    }
  | {
      kind: 'occurrences';
      cause: unknown;
    }
  | {
      kind: 'program';
      cause: unknown;
    };
