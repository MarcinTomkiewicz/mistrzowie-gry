import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { IUniversalCalendarDay } from './i-universal-calendar';
import { ISelectOption } from './i-select-option';

export interface IGmAvailabilitySlotRecord {
  id?: string;
  gmProfileId: string;
  startsAt: string;
  endsAt: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface IGmAvailabilityRange {
  id: string;
  startOffset: number;
  endOffset: number;
}

export interface IGmAvailabilityDay {
  date: string;
  ranges: readonly IGmAvailabilityRange[];
}

export interface IGmAvailabilityHourOption extends ISelectOption<number> {}

export interface IGmAvailabilityEditorError {
  title: string;
  body: string;
}

export interface IGmAvailabilityCalendarDay extends IUniversalCalendarDay {}

export type GmAvailabilityRangeFormGroup = FormGroup<{
  id: FormControl<string>;
  startOffset: FormControl<number>;
  endOffset: FormControl<number>;
}>;

export type GmAvailabilityEditorFormGroup = FormGroup<{
  ranges: FormArray<GmAvailabilityRangeFormGroup>;
}>;
