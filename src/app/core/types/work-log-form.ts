import { FormArray, FormControl, FormGroup, FormRecord } from '@angular/forms';

export type WorkLogRangeFormGroup = FormGroup<{
  startOffset: FormControl<number>;
  endOffset: FormControl<number>;
}>;

export type WorkLogDayFormGroup = FormGroup<{
  id: FormControl<string | null>;
  comment: FormControl<string>;
  isChaoticThursday: FormControl<boolean>;
  ranges: FormArray<WorkLogRangeFormGroup>;
}>;

export type WorkLogFormRecord = FormRecord<WorkLogDayFormGroup>;
