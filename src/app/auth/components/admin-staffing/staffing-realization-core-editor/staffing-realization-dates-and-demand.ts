import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { provideTranslocoScope } from '@jsverse/transloco';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';

import { STAFFING_SCOPE } from '../../../../core/translations/staffing.i18n';
import { StaffingRealizationInitialDaysForm } from '../../../../core/types/staffing-realization-form';
import { StaffingRealizationDayDraft } from '../../../../core/types/staffing-realization-editor-draft';
import {
  compareDatesByDay,
  formatDateLabel,
  isValidDate,
  toIsoDate,
} from '../../../../core/utils/date';
import {
  getStaffingDemandError,
  getStaffingInitialDateRangeError,
} from '../staffing-realization-form-errors';
import { createStaffingRealizationCoreEditorI18n } from './staffing-realization-core-editor.i18n';

@Component({
  selector: 'app-staffing-realization-dates-and-demand',
  imports: [
    ReactiveFormsModule,
    DatePickerModule,
    FloatLabelModule,
    InputNumberModule,
  ],
  templateUrl: './staffing-realization-dates-and-demand.html',
  providers: [
    provideTranslocoScope('adminStaffing', STAFFING_SCOPE, 'common'),
  ],
})
export class StaffingRealizationDatesAndDemand {
  readonly isNew = input.required<boolean>();
  readonly initialDaysForm =
    input.required<StaffingRealizationInitialDaysForm>();
  readonly days = input.required<readonly StaffingRealizationDayDraft[]>();

  protected readonly i18n = createStaffingRealizationCoreEditorI18n();
  protected readonly demandError = getStaffingDemandError;
  protected readonly rangeError = getStaffingInitialDateRangeError;
  protected readonly summary = computed(() => {
    const days = this.days();
    const dates = days.map((day) => day.date)
      .filter(isValidDate)
      .sort(compareDatesByDay);
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const dailyDemand = days.map((day) => day.requiredGmCount);
    const minimumDemand = dailyDemand.length ? Math.min(...dailyDemand) : 0;
    const maximumDemand = dailyDemand.length ? Math.max(...dailyDemand) : 0;

    return {
      dateRange:
        !firstDate ? '' : compareDatesByDay(firstDate, lastDate) === 0
          ? formatDateLabel(toIsoDate(firstDate))
          : `${formatDateLabel(toIsoDate(firstDate))} - ${formatDateLabel(toIsoDate(lastDate))}`,
      dayCount: days.length,
      requiredGmCount:
        minimumDemand === maximumDemand
          ? String(minimumDemand)
          : `${minimumDemand}-${maximumDemand}`,
    };
  });
}
