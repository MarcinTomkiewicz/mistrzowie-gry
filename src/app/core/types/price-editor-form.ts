import type { FormControl, FormGroup } from '@angular/forms';

import type {
  ActualCostBasis,
  BillingUnit,
  PercentageBasis,
  PriceType,
} from './price';

export type PriceEditorForm = FormGroup<{
  type: FormControl<PriceType>;
  amount: FormControl<number | null>;
  minAmount: FormControl<number | null>;
  maxAmount: FormControl<number | null>;
  unit: FormControl<BillingUnit>;
  value: FormControl<number | null>;
  minValue: FormControl<number | null>;
  maxValue: FormControl<number | null>;
  percentageBasis: FormControl<PercentageBasis>;
  actualCostBasis: FormControl<ActualCostBasis>;
  note: FormControl<string>;
}>;
