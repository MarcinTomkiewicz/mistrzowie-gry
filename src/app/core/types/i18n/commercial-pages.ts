import type {
  CommercialBillingUnit,
  CommercialPercentageBasis,
} from '../commercial-price';
import type { CommercialProductFieldKey } from '../commercial-page-builder';

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
    hours: CommercialPluralUnitTranslations;
    minutes: CommercialPluralUnitTranslations;
  };
  sessions: {
    count: CommercialPluralUnitTranslations;
    perMonth: string;
  };
};

export type CommercialProductFieldLabelsTranslations = Record<
  CommercialProductFieldKey,
  string
>;

type CommercialPluralUnitTranslations = {
  one: string;
  few: string;
  many: string;
  other: string;
};
