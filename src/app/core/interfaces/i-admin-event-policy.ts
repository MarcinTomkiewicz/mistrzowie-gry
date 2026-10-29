import type { ParticipantSignupKind } from '../enums/event';
import type { AdminEffectivePolicyResult, EventCurrency, EventGlobalPolicyInput, EventPriceBasis } from './i-admin-global-event';

export type PolicyPricedValue = Readonly<{ amount: number; currency: EventCurrency; basis: EventPriceBasis }>;
export type PolicyPrice = PolicyPricedValue | Readonly<{ amount: null; currency: EventCurrency; basis: null }>;
export type PolicyGlobal = Readonly<Omit<EventGlobalPolicyInput, 'price'> & { price: PolicyPrice }>;
export type PolicyOverride<T> = Readonly<{ enabled: false; value: null }> | Readonly<{ enabled: true; value: T }>;

export interface PolicyCityOverride {
  readonly editionId: string;
  readonly overrides: {
    readonly price: PolicyOverride<PolicyPricedValue>;
    readonly cover: PolicyOverride<string | null>;
    readonly signup: PolicyOverride<Readonly<{ kind: ParticipantSignupKind; required: boolean }>>;
    readonly sessionCapacityCeiling: PolicyOverride<number | null>;
    readonly wholeEventCapacity: PolicyOverride<number | null>;
  };
}

export interface PolicyDocument {
  readonly global: PolicyGlobal;
  readonly cityOverrides: readonly PolicyCityOverride[];
}

export type AdminEventPolicyDraft = {
  coreId: string;
  baselineFingerprint: string;
  canonicalBaseline: AdminEffectivePolicyResult;
  appliedToPublic: false;
} & (
  | { hasDraft: false; revision: 0; document: null; baselineChanged: false }
  | { hasDraft: true; revision: number; document: PolicyDocument; baselineChanged: boolean }
);

type PolicyPreviewFlags = {
  coreId: string;
  requiresEfs050OptionalCapacityAmendment: false;
  appliedToPublic: false;
  appliedToParticipantRegistration: false;
};

export interface PolicyFieldError { field: string; editionId?: string; code: string }
export interface PolicyBlocker { code: string; editionId?: string }

export type AdminEventPolicyFullPreview = PolicyPreviewFlags & {
  mainEditionId: string;
  baselineFingerprint: string;
  normalizedDocument: PolicyDocument;
  global: PolicyGlobal;
  editions: {
    editionId: string; city: string; isMain: boolean;
    overrides: PolicyCityOverride['overrides']; effective: EventGlobalPolicyInput; changedFields: string[];
  }[];
  impact: {
    affectedCityCount: number;
    changedCities: { editionId: string; city: string; fields: string[] }[];
    publishedOccurrenceCount: number;
    participantHistoryRows: number;
  };
} & (
  | { valid: true; status: 'draft_ready'; fieldErrors: []; blockers: [] }
  | { valid: false; status: 'invalid'; fieldErrors: PolicyFieldError[]; blockers: PolicyBlocker[] }
  | { valid: false; status: 'blocked'; fieldErrors: PolicyFieldError[]; blockers: PolicyBlocker[] }
);

export type AdminEventPolicyPreview = AdminEventPolicyFullPreview | (PolicyPreviewFlags & {
  valid: false;
  status: 'invalid';
  fieldErrors: { field: 'policy'; code: 'INVALID_POLICY_DRAFT'; detail: string }[];
  blockers: [];
  participantSignupOpened: false;
});

export type AdminEventPolicySave = {
  saved: true;
  status: 'draft_saved';
  coreId: string;
  revision: number;
  document: PolicyDocument;
  baselineFingerprint: string;
  preview: Extract<AdminEventPolicyFullPreview, { valid: true }>;
  appliedToPublic: false;
} | {
  saved: false;
  status: 'invalid';
  revision: number;
  preview: Extract<AdminEventPolicyPreview, { valid: false }>;
};
