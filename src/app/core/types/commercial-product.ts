import type { Price } from './price';
import type { RichContent } from './rich-content';

export type CommercialProductKind = 'product' | 'addon';

export type CommercialProductPrice = {
  price: Price;
  label: string | null;
  primary: boolean;
};

export type CommercialSessionCount =
  | { mode: 'not_applicable'; count: null }
  | { mode: 'total'; count: number }
  | { mode: 'per_month'; count: number };

export type CommercialFrequency =
  | { mode: 'not_applicable' | 'one_time'; count: null }
  | { mode: 'weekly' | 'monthly'; count: number };

export type CommercialCooperationLength =
  | { mode: 'not_applicable' | 'one_time'; semesters: null }
  | { mode: 'exact' | 'minimum'; semesters: number };

export type CommercialProductFieldKey =
  | 'name'
  | 'description'
  | 'price'
  | 'duration'
  | 'participants'
  | 'participantsMin'
  | 'participantsMax'
  | 'participantsPerFacilitatorMax'
  | 'sessions'
  | 'frequency'
  | 'cooperationLength'
  | 'meetingCount'
  | 'facilitatorCount'
  | 'tableCount'
  | 'includedAddons'
  | 'settlement'
  | 'participantPrice'
  | 'facilitatorPrice';

export type CommercialEditorDuration =
  | { mode: 'standard'; minutes: null }
  | { mode: 'custom'; minutes: number }
  | { mode: 'not_applicable'; minutes: null };

export type CommercialRenderDuration =
  | { mode: 'standard'; minutes: number }
  | { mode: 'custom'; minutes: number }
  | { mode: 'not_applicable'; minutes: null };

export type CommercialEditorParticipants =
  | {
      mode: 'standard';
      min: null;
      max: null;
      perFacilitatorMax: null;
    }
  | {
      mode: 'custom';
      min: number | null;
      max: number | null;
      perFacilitatorMax: number | null;
    }
  | {
      mode: 'not_applicable';
      min: null;
      max: null;
      perFacilitatorMax: null;
    };

export type CommercialRenderParticipants =
  | {
      mode: 'standard';
      min: null;
      max: number;
      perFacilitatorMax: null;
    }
  | {
      mode: 'custom';
      min: number | null;
      max: number | null;
      perFacilitatorMax: number | null;
    }
  | {
      mode: 'not_applicable';
      min: null;
      max: null;
      perFacilitatorMax: null;
    };

type CommercialProductBase<
  TDuration extends CommercialEditorDuration | CommercialRenderDuration,
  TParticipants extends
    | CommercialEditorParticipants
    | CommercialRenderParticipants,
> = {
  id: string;
  position: number;
  kind: CommercialProductKind;
  name: string;
  description: RichContent | null;
  prices: CommercialProductPrice[];
  duration: TDuration;
  participants: TParticipants;
  sessions: CommercialSessionCount;
  frequency: CommercialFrequency;
  cooperationLength: CommercialCooperationLength;
  meetingCountMin: number | null;
  meetingCountMax: number | null;
  facilitatorCount: number | null;
  tableCount: number | null;
  includedAddonIds: string[];
  settlement: string | null;
};

export type CommercialEditorProduct = CommercialProductBase<
  CommercialEditorDuration,
  CommercialEditorParticipants
>;

export type CommercialIncludedAddon = {
  id: string;
  name: string;
};

export type CommercialRenderProduct = CommercialProductBase<
  CommercialRenderDuration,
  CommercialRenderParticipants
> & {
  includedAddons: CommercialIncludedAddon[];
  participantPrice: Price | null;
  facilitatorPrice: Price | null;
  participantsMin: number | null;
  participantsMax: number | null;
};
