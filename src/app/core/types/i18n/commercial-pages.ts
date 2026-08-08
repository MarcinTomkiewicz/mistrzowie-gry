import type {
  CommercialBillingUnit,
  CommercialPercentageBasis,
} from '../commercial-price';

export type CommercialPageLabelsTranslations = {
  effectiveFrom: string;
};

export type CommercialPricingTranslations = {
  from: string;
  units: Record<CommercialBillingUnit, string>;
  percentageBases: Record<CommercialPercentageBasis, string>;
};

export type CommercialItemDetailsTranslations = {
  from: string;
  to: string;
  participants: string;
  participantsPerFacilitator: string;
  facilitators: string;
  tables: string;
  durationMinutes: string;
  sessions: string;
  sessionsPerMonth: string;
  meetings: string;
};
