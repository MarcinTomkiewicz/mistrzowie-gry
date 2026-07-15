import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type GmAvailabilityRangeFormGroup = FormGroup<{
  id: FormControl<string>;
  startOffset: FormControl<number>;
  endOffset: FormControl<number>;
}>;

export type GmAvailabilityEditorFormGroup = FormGroup<{
  ranges: FormArray<GmAvailabilityRangeFormGroup>;
}>;
