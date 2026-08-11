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

export type CommercialProductValueTranslations = {
  from: string;
  to: string;
  duration: {
    hours: CommercialDurationUnitTranslations;
    minutes: CommercialDurationUnitTranslations;
  };
};

type CommercialDurationUnitTranslations = {
  one: string;
  few: string;
  many: string;
  other: string;
};
