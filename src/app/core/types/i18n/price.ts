import type {
  ActualCostBasis,
  BillingUnit,
  PercentageBasis,
  PriceType,
} from '../price';

export type PricePresentationTranslations = {
  from: string;
  units: Record<BillingUnit, string>;
  percentageBases: Record<PercentageBasis, string>;
};

export type PriceEditorTranslations = {
  fields: {
    sectionTitle: string;
    type: string;
    amount: string;
    minAmount: string;
    maxAmount: string;
    value: string;
    minValue: string;
    maxValue: string;
    unit: string;
    basis: string;
    note: string;
  };
  validation: {
    invalid: string;
    invalidRange: string;
    invalidPercentage: string;
    noteRequired: string;
  };
  types: Record<PriceType, string>;
  billingUnits: Record<BillingUnit, string>;
  percentageBases: Record<PercentageBasis, string>;
  actualCostBases: Record<ActualCostBasis, string>;
};

export type PriceFootnotesTranslations = {
  net: string;
  gross: string;
  both: string;
};

export type PriceTranslations = {
  presentation: PricePresentationTranslations;
  editor: PriceEditorTranslations;
  footnotes: PriceFootnotesTranslations;
};
