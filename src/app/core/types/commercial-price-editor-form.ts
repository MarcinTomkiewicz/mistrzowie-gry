import type { FormControl, FormGroup } from '@angular/forms';

import type {
  CommercialActualCostBasis,
  CommercialBillingUnit,
  CommercialPercentageBasis,
  CommercialPriceType,
} from './commercial-price';

export type CommercialPriceEditorForm = FormGroup<{
  type: FormControl<CommercialPriceType>;
  amount: FormControl<number | null>;
  minAmount: FormControl<number | null>;
  maxAmount: FormControl<number | null>;
  unit: FormControl<CommercialBillingUnit>;
  value: FormControl<number | null>;
  minValue: FormControl<number | null>;
  maxValue: FormControl<number | null>;
  percentageBasis: FormControl<CommercialPercentageBasis>;
  actualCostBasis: FormControl<CommercialActualCostBasis>;
  note: FormControl<string>;
}>;
