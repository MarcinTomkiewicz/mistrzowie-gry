import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { IGmAvailabilityRange } from '../interfaces/i-gm-availability';
import { GmAvailabilityRangeFormGroup } from '../types/gm-availability-form';

export function createGmAvailabilityRangeFormGroup(
  range: IGmAvailabilityRange,
): GmAvailabilityRangeFormGroup {
  return new FormGroup({
    startOffset: new FormControl(range.startOffset, { nonNullable: true }),
    endOffset: new FormControl(range.endOffset, { nonNullable: true }),
  });
}

export function replaceGmAvailabilityRangeFormGroups(
  formArray: FormArray<GmAvailabilityRangeFormGroup>,
  ranges: readonly IGmAvailabilityRange[],
): void {
  formArray.clear();

  for (const range of ranges) {
    formArray.push(createGmAvailabilityRangeFormGroup(range));
  }
}

export function mapGmAvailabilityRangeFormGroupsToRanges(
  rangeGroups: readonly GmAvailabilityRangeFormGroup[],
): IGmAvailabilityRange[] {
  return [...rangeGroups]
    .map((rangeGroup) => ({
      startOffset: rangeGroup.controls.startOffset.getRawValue(),
      endOffset: rangeGroup.controls.endOffset.getRawValue(),
    }))
    .sort((left, right) => left.startOffset - right.startOffset);
}
