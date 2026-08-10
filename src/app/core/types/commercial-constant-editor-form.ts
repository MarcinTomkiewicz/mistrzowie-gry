import type { FormControl, FormGroup } from '@angular/forms';

import type {
  CommercialConstantSavePayload,
  CommercialConstantValueType,
} from './commercial-constant-admin';

export type CommercialConstantDurationUnit = 'hours' | 'minutes';

export type CommercialConstantEditorForm = FormGroup<{
  token: FormControl<string>;
  label: FormControl<string>;
  valueType: FormControl<CommercialConstantValueType>;
  numericValue: FormControl<number | null>;
  textValue: FormControl<string>;
  durationUnit: FormControl<CommercialConstantDurationUnit>;
}>;

export type CommercialConstantEditorSave = {
  constantId: string | null;
  payload: CommercialConstantSavePayload;
};
