import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { IGmAvailabilityRange } from '../interfaces/i-gm-availability';
import { GmAvailabilityRangeFormGroup } from '../types/gm-availability-form';

export function createGmAvailabilityRangeFormGroup(
  range: IGmAvailabilityRange,
): GmAvailabilityRangeFormGroup {
  return new FormGroup({
    id: new FormControl(range.id, { nonNullable: true }),
    startOffset: new FormControl(range.startOffset, { nonNullable: true }),
    endOffset: new FormControl(range.endOffset, { nonNullable: true }),
  });
}

export function replaceGmAvailabilityRangeFormGroups(
  formArray: FormArray<GmAvailabilityRangeFormGroup>,
  ranges: readonly IGmAvailabilityRange[],
): GmAvailabilityRangeFormGroup[] {
  formArray.clear();

  for (const range of ranges) {
    formArray.push(createGmAvailabilityRangeFormGroup(range));
  }

  return [...formArray.controls];
}

export function mapGmAvailabilityRangeFormGroupsToRanges(
  rangeGroups: readonly GmAvailabilityRangeFormGroup[],
): IGmAvailabilityRange[] {
  return [...rangeGroups]
    .map((rangeGroup) => ({
      id: rangeGroup.controls.id.getRawValue(),
      startOffset: Number(rangeGroup.controls.startOffset.getRawValue()),
      endOffset: Number(rangeGroup.controls.endOffset.getRawValue()),
    }))
    .sort((left, right) => left.startOffset - right.startOffset);
}
