import { FormControl, FormGroup } from '@angular/forms';

export type GmAvailabilityRangeFormGroup = FormGroup<{
  startOffset: FormControl<number>;
  endOffset: FormControl<number>;
}>;
