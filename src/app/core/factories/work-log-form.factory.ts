import { FormArray, FormControl, FormGroup } from '@angular/forms';

import { IUserWorkLogDay } from '../interfaces/i-work-log';
import { WorkLogRangeDraft } from '../types/work-log';
import {
  WorkLogDayFormGroup,
  WorkLogFormRecord,
  WorkLogRangeFormGroup,
} from '../types/work-log-form';
import { upsertWorkLogDay } from '../domain/work-log/mapping';
import { isChaoticThursdayDate } from '../domain/work-log/rules';

export function createWorkLogRangeFormGroup(
  range: WorkLogRangeDraft,
  disabled: boolean,
): WorkLogRangeFormGroup {
  return new FormGroup({
    startOffset: new FormControl(
      { value: range.startOffset, disabled },
      { nonNullable: true },
    ),
    endOffset: new FormControl(
      { value: range.endOffset, disabled },
      { nonNullable: true },
    ),
  });
}

export function replaceWorkLogFormDays(
  form: WorkLogFormRecord,
  dates: readonly string[],
  days: readonly IUserWorkLogDay[],
  editable: boolean,
): void {
  const dayByDate = new Map(days.map((day) => [day.date, day] as const));

  for (const date of Object.keys(form.controls)) {
    form.removeControl(date, { emitEvent: false });
  }

  for (const date of dates) {
    form.addControl(
      date,
      createWorkLogDayFormGroup(date, dayByDate.get(date), editable),
      { emitEvent: false },
    );
  }

  form.updateValueAndValidity();
  form.markAsPristine();
}

export function resetWorkLogDayForm(dayForm: WorkLogDayFormGroup): void {
  const id = dayForm.controls.id.getRawValue();

  dayForm.controls.ranges.clear({ emitEvent: false });
  dayForm.reset({
    id,
    comment: '',
    isChaoticThursday: false,
  });
}

export function mapWorkLogFormToDays(
  form: WorkLogFormRecord,
): IUserWorkLogDay[] {
  return Object.entries(form.getRawValue()).reduce<IUserWorkLogDay[]>(
    (days, [date, day]) =>
      upsertWorkLogDay(days, {
        id: day.id ?? undefined,
        date,
        ranges: day.ranges,
        isChaoticThursday: day.isChaoticThursday,
        comment: day.comment,
      }),
    [],
  );
}

export function placeWorkLogRangeFormGroupChronologically(
  dayForm: WorkLogDayFormGroup,
  rangeGroup: WorkLogRangeFormGroup,
): void {
  const ranges = dayForm.controls.ranges;
  const startOffset = rangeGroup.controls.startOffset.getRawValue();
  const currentIndex = ranges.controls.indexOf(rangeGroup);
  const targetIndex = ranges.controls.filter(
    (control) =>
      control !== rangeGroup &&
      control.controls.startOffset.getRawValue() < startOffset,
  ).length;

  if (currentIndex === targetIndex) {
    return;
  }

  if (currentIndex >= 0) {
    ranges.removeAt(currentIndex, { emitEvent: false });
  }
  ranges.insert(targetIndex, rangeGroup);
}

function createWorkLogDayFormGroup(
  date: string,
  day: IUserWorkLogDay | undefined,
  editable: boolean,
): WorkLogDayFormGroup {
  const disabled = !editable;
  const ranges = [...(day?.ranges ?? [])]
    .sort((left, right) => left.startOffset - right.startOffset)
    .map((range) => createWorkLogRangeFormGroup(range, disabled));

  return new FormGroup({
    id: new FormControl(day?.id ?? null),
    comment: new FormControl(
      { value: day?.comment ?? '', disabled },
      { nonNullable: true },
    ),
    isChaoticThursday: new FormControl(
      {
        value: day?.isChaoticThursday ?? false,
        disabled: disabled || !isChaoticThursdayDate(date),
      },
      { nonNullable: true },
    ),
    ranges: new FormArray(ranges),
  });
}
