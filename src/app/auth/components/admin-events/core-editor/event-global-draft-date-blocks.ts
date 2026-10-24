import { Component, computed, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FloatLabelModule } from 'primeng/floatlabel';
import { startWith, switchMap } from 'rxjs';

import { IsoDateValue } from '../../../../common/iso-date-value/iso-date-value';
import { createEventDateTimeBlocksForm } from '../../../../core/factories/event-dated-time-block-form.factory';
import { mapEventScheduleFormToPayload } from '../../../../core/factories/event-schedule-form.factory';
import type { EventGlobalDraftForm } from '../../../../core/factories/event-global-draft-form.factory';
import { mapEventGlobalTimeBlocks } from '../../../../core/factories/event-global-time-block-form.factory';
import { formatDateLabel, isValidDate, toIsoDate } from '../../../../core/utils/date';
import { isEventScheduleDateCandidate } from '../../../../core/utils/event-schedule';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalTimeBlocks } from './event-global-time-blocks';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';

type Scope = 'dateTimeBlocks' | 'mainCityDateTimeBlocks';

@Component({
  selector: 'app-event-global-draft-date-blocks',
  imports: [FormsModule, ButtonModule, DatePickerModule, FloatLabelModule, IsoDateValue,
    EventGlobalTimeBlocks, EventGlobalTimeBlocksSummary],
  templateUrl: './event-global-draft-date-blocks.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalDraftDateBlocks {
  readonly form = input.required<EventGlobalDraftForm>();
  readonly validationAttempted = input(false);
  protected readonly selectedDate = signal('');
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly standalone = { standalone: true };
  protected readonly scopes = [
    { key: 'dateTimeBlocks', label: 'dateScope' },
    { key: 'mainCityDateTimeBlocks', label: 'mainCityScope' },
  ] as const;
  private readonly values = toSignal(toObservable(this.form).pipe(
    switchMap(form => form.valueChanges.pipe(startWith(form.getRawValue()))),
  ));
  private readonly scheduleChanges = toSignal(toObservable(this.form).pipe(
    switchMap(form => form.controls.schedule.valueChanges.pipe(startWith(form.controls.schedule.getRawValue()))),
  ));
  private readonly candidateSchedule = computed(() => {
    this.scheduleChanges();
    const schedule = this.form().controls.schedule;
    return schedule.valid ? mapEventScheduleFormToPayload(schedule) : null;
  });
  protected readonly configuredDates = computed(() => {
    this.values();
    return [...new Set(this.scopes.flatMap(scope => this.form().controls[scope.key].getRawValue().map(row => row.date)))].sort();
  });

  protected selectDate(value: unknown): void {
    if (this.form().disabled) return;
    if (value !== null && !isValidDate(value)) throw new Error('[EVENT_DATED_BLOCKS] Invalid date selection.');
    this.selectedDate.set(value === null ? '' : toIsoDate(value));
  }

  protected dateAllowed(date: string): boolean {
    const schedule = this.candidateSchedule();
    return schedule !== null && isEventScheduleDateCandidate(schedule, date);
  }

  protected dateInvalid(date: string): boolean {
    return !this.dateAllowed(date) || this.scopes.some(scope =>
      this.form().controls[scope.key].controls.some(row => row.controls.date.value === date && row.invalid));
  }

  protected row(scope: Scope) {
    return this.form().controls[scope].controls.find(row => row.controls.date.value === this.selectedDate());
  }

  protected configure(scope: Scope): void {
    if (this.form().disabled || !this.dateAllowed(this.selectedDate()) || this.row(scope)) return;
    this.form().controls[scope].push(createEventDateTimeBlocksForm(this.selectedDate()));
    this.form().markAsDirty();
  }

  protected inherit(scope: Scope): void {
    if (this.form().disabled) return;
    const rows = this.form().controls[scope];
    const index = rows.controls.findIndex(row => row.controls.date.value === this.selectedDate());
    if (index < 0) return;
    rows.removeAt(index);
    this.form().markAsDirty();
  }

  protected inheritedBlocks(scope: Scope) {
    const dateRow = this.row('dateTimeBlocks');
    return mapEventGlobalTimeBlocks(scope === 'mainCityDateTimeBlocks' && dateRow
      ? dateRow.controls.timeBlocks : this.form().controls.timeBlocks);
  }
}
