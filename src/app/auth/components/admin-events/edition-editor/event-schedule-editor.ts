import { Component, DestroyRef, computed, inject, input, OnInit, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePicker, DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';

import { IsoDateValue } from '../../../../common/iso-date-value/iso-date-value';
import { createEventExdateControl, createEventScheduleExclusionRule, getEventScheduleExdates } from '../../../../core/factories/event-schedule-form.factory';
import type { EventScheduleFormGroup } from '../../../../core/types/event-admin-form';
import type { EventMonthlyNth, EventRecurrenceKind, EventScheduleKind, EventScheduleMode } from '../../../../core/types/event';
import { formatDateLabel, getWeekdayLabels, isValidDate, isValidIsoDate, toIsoDate } from '../../../../core/utils/date';
import { setControlValue } from '../../../../core/utils/form-controls';
import { createEventScheduleEditorI18n } from './edition-editor.i18n';

type DateField = 'date' | 'startDate' | 'endDate';

const ERROR_FIELDS: Record<string, readonly (keyof EventScheduleFormGroup['controls'])[]> = {
  singleDate: ['date'], exactDatesRequired: ['dates'], exactDatesInvalid: ['dates'], exactDatesDuplicate: ['dates'],
  recurrenceDates: ['startDate', 'endDate'], recurrenceDateRange: ['startDate', 'endDate'],
  dateRangeLength: ['startDate', 'endDate'], weeklyDays: ['byweekday'], monthlyNth: ['monthlyNth'],
  monthlyWeekday: ['monthlyWeekday'], dayOfMonth: ['dayOfMonth'], intervalMin: ['interval'],
  allDatesExcluded: ['exclusionRules'],
};

@Component({
  selector: 'app-event-schedule-editor',
  imports: [FormsModule, ReactiveFormsModule, ButtonModule, CheckboxModule, DatePickerModule,
    FloatLabelModule, InputNumberModule, RadioButtonModule, SelectModule, IsoDateValue],
  templateUrl: './event-schedule-editor.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventScheduleEditor implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pickers = viewChildren(DatePicker);
  readonly form = input.required<EventScheduleFormGroup>();
  readonly globalCalendar = input(false);
  readonly validationAttempted = input(false);
  readonly externalError = input<string | null>(null);
  protected readonly i18n = createEventScheduleEditorI18n();
  protected readonly standaloneModel = { standalone: true };
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly globalKindOptions = computed(() => {
    const options = this.i18n.options();
    return [
      { value: 'single', label: this.i18n.commonValues().oneTime, hint: options.singleHint, icon: 'pi pi-sun-eclipse' },
      { value: 'exact_dates', label: options.selectedDates, hint: options.selectedDatesHint, icon: 'pi pi-tied-scroll' },
      { value: 'recurring', label: options.cyclic, hint: options.cyclicHint, icon: 'pi pi-sundial' },
    ] as const;
  });
  protected readonly scheduleKindOptions = computed(() => {
    const options = this.i18n.options();
    return [
      { value: 'single', label: options.single }, { value: 'recurring', label: options.recurring },
      { value: 'exact_dates', label: options.exactDates },
    ];
  });
  protected readonly recurrenceKindOptions = computed<{ value: EventRecurrenceKind; label: string }[]>(() => [
    { value: 'WEEKLY', label: this.globalCalendar() ? this.i18n.options().weeklyCycle : this.i18n.commonValues().weekly },
    { value: 'MONTHLY_DAY_OF_MONTH', label: this.i18n.commonLabels().monthlyDayOfMonth },
    { value: 'MONTHLY_NTH_WEEKDAY', label: this.i18n.commonLabels().monthlyNthWeekday },
  ]);
  protected readonly monthlyNthOptions = computed<{ value: EventMonthlyNth; label: string }[]>(() => [
    { value: 1, label: this.i18n.commonLabels().first }, { value: 2, label: this.i18n.commonLabels().second },
    { value: 3, label: this.i18n.commonLabels().third }, { value: 4, label: this.i18n.commonLabels().fourth },
    { value: -1, label: this.i18n.commonLabels().last },
  ]);
  protected readonly weekdayOptions = getWeekdayLabels('pl-PL', 1).map((label, index) => ({
    value: [1, 2, 3, 4, 5, 6, 0][index], label,
  }));
  protected readonly errors = computed(() => Object.entries(this.i18n.validation()).map(([key, label]) => ({ key, label })));
  protected readonly getEventScheduleExdates = getEventScheduleExdates;

  ngOnInit(): void {
    const form = this.form();
    form.controls.kind.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(kind => this.syncScheduleKind(kind));
    form.controls.recurrenceKind.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(kind => this.syncRecurrenceKind(kind));
    this.syncScheduleKind(form.controls.kind.value);
  }

  protected selectGlobalKind(kind: EventScheduleKind): void {
    const control = this.form().controls.kind;
    if (this.form().disabled || (kind === 'exact_dates' && control.value === 'range')) return;
    setControlValue(control, kind);
  }

  protected addExclusionRule(): void {
    const rules = this.form().controls.exclusionRules;
    if (rules.disabled) return;
    rules.push(createEventScheduleExclusionRule());
    rules.markAsDirty();
    rules.markAsTouched();
  }

  protected removeExclusionRule(index: number): void {
    const rules = this.form().controls.exclusionRules;
    if (rules.disabled) return;
    rules.removeAt(index);
    rules.markAsDirty();
    rules.markAsTouched();
  }

  protected dateFields() {
    const kind = this.form().controls.kind.value;
    const labels = this.i18n.commonLabels();
    if (kind === 'single') return [{ name: 'date' as const, label: labels.eventDate }];
    return kind === 'range' || kind === 'recurring'
      ? [{ name: 'startDate' as const, label: labels.scheduleStart }, { name: 'endDate' as const, label: labels.scheduleEnd }] : [];
  }

  protected showValidation(): boolean {
    const form = this.form();
    return !this.pickers().some(picker => picker.overlayVisible) &&
      (this.globalCalendar() ? this.validationAttempted() || (form.dirty && form.touched) : form.touched);
  }

  protected dateInvalid(field: DateField): boolean {
    const form = this.form();
    const errors = field === 'date' ? ['singleDate'] : ['recurrenceDates', 'recurrenceDateRange', 'dateRangeLength'];
    return this.showExternalError() || errors.some(key => this.canShowError(key) && form.hasError(key));
  }

  protected canShowError(key: string): boolean {
    if (!this.showValidation()) return false;
    if (!this.globalCalendar() || this.validationAttempted()) return true;
    return ERROR_FIELDS[key]?.every(name => this.form().controls[name].dirty && this.form().controls[name].touched) ?? false;
  }

  protected showExternalError(): boolean {
    if (!this.externalError()) return false;
    const kind = this.form().controls.kind.value;
    return this.canShowError(kind === 'single' ? 'singleDate' : kind === 'exact_dates' ? 'exactDatesInvalid' : 'recurrenceDates');
  }

  protected setDate(field: DateField, value: unknown): void {
    if (this.form().disabled) return;
    if (value !== null && !isValidDate(value)) throw new Error('[EVENT_SCHEDULE] Invalid date selection.');
    setControlValue(this.form().controls[field], value === null ? '' : toIsoDate(value));
  }

  protected setDates(field: 'dates' | 'exdates', value: unknown): void {
    if (this.form().disabled) return;
    const selection = value === null ? [] : value;
    if (!Array.isArray(selection) || !selection.every(isValidDate)) throw new Error('[EVENT_SCHEDULE] Invalid dates selection.');
    const dates = this.form().controls[field];
    dates.clear({ emitEvent: false });
    for (const date of [...new Set(selection.map(toIsoDate))].sort()) {
      dates.push(field === 'exdates' ? createEventExdateControl(date) : new FormControl(date, { nonNullable: true }), { emitEvent: false });
    }
    dates.markAsDirty();
    dates.markAsTouched();
    dates.updateValueAndValidity();
  }

  protected removeDate(field: 'dates' | 'exdates', date: string): void {
    const dates = this.form().controls[field];
    if (dates.disabled) return;
    const index = dates.getRawValue().indexOf(date);
    if (index < 0) return;
    dates.removeAt(index);
    dates.markAsDirty();
    dates.markAsTouched();
  }

  protected selectedDates(field: 'dates' | 'exdates'): string[] {
    return [...new Set(this.form().controls[field].getRawValue())].filter(isValidIsoDate).sort();
  }

  private syncScheduleKind(kind: EventScheduleMode): void {
    const form = this.form();
    if (kind !== 'recurring') {
      form.patchValue({ recurrenceKind: 'WEEKLY', interval: 1, byweekday: [], monthlyNth: null,
        monthlyWeekday: null, dayOfMonth: null, ...(kind === 'range' ? {} : { startDate: '', endDate: '' }) }, { emitEvent: false });
      form.controls.exdates.clear({ emitEvent: false });
      form.controls.exclusionRules.clear({ emitEvent: false });
    }
    if (kind !== 'single') form.controls.date.setValue('', { emitEvent: false });
    if (kind === 'recurring') this.syncRecurrenceKind(form.controls.recurrenceKind.value);
    form.updateValueAndValidity();
  }

  private syncRecurrenceKind(kind: EventRecurrenceKind): void {
    const form = this.form();
    if (form.controls.kind.value !== 'recurring') return;
    switch (kind) {
      case 'WEEKLY':
        form.patchValue({ monthlyNth: null, monthlyWeekday: null, dayOfMonth: null }, { emitEvent: false });
        break;
      case 'MONTHLY_NTH_WEEKDAY':
        form.patchValue({ byweekday: [], monthlyNth: form.controls.monthlyNth.value ?? 1,
          monthlyWeekday: form.controls.monthlyWeekday.value ?? 1, dayOfMonth: null }, { emitEvent: false });
        break;
      case 'MONTHLY_DAY_OF_MONTH':
        form.patchValue({ byweekday: [], monthlyNth: null, monthlyWeekday: null,
          dayOfMonth: form.controls.dayOfMonth.value ?? 1 }, { emitEvent: false });
        break;
    }
    form.updateValueAndValidity();
  }
}
