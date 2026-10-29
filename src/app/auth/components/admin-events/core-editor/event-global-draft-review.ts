import { Component, computed, input } from '@angular/core';

import { mapEventGlobalDraftToPayload, type EventGlobalDraftForm } from '../../../../core/factories/event-global-draft-form.factory';
import { formatDateLabel, getWeekdayLabels } from '../../../../core/utils/date';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalPolicySummary } from './policy/event-global-policy-summary';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';

@Component({
  selector: 'app-event-global-draft-review',
  imports: [EventGlobalPolicySummary, EventGlobalTimeBlocksSummary],
  templateUrl: './event-global-draft-review.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalDraftReview {
  readonly form = input.required<EventGlobalDraftForm>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly value = computed(() => mapEventGlobalDraftToPayload(this.form()));
  protected readonly dates = computed(() => {
    const schedule = this.value().schedule;
    return schedule.kind === 'single' ? [schedule.date] : schedule.kind === 'exact_dates' ? schedule.dates : [];
  });
  protected readonly recurrenceRows = computed(() => {
    const schedule = this.value().schedule;
    if (schedule.kind !== 'recurring') return [];
    const labels = this.i18n.commonLabels();
    const weekdays = getWeekdayLabels('pl-PL', 0);
    const rows = [{ label: labels.interval, value: String(schedule.interval) }];
    switch (schedule.recurrenceKind) {
      case 'WEEKLY':
        return [{ label: labels.recurrenceKind, value: this.i18n.commonValues().weekly }, ...rows,
          { label: labels.weekdays, value: schedule.byweekday.map(day => weekdays[day]).join(', ') }];
      case 'MONTHLY_DAY_OF_MONTH':
        return [{ label: labels.recurrenceKind, value: labels.monthlyDayOfMonth }, ...rows,
          { label: labels.dayOfMonth, value: String(schedule.dayOfMonth) }];
      case 'MONTHLY_NTH_WEEKDAY':
        return [{ label: labels.recurrenceKind, value: labels.monthlyNthWeekday }, ...rows,
          { label: labels.dayOfMonth, value: schedule.monthlyNth === -1 ? labels.last : String(schedule.monthlyNth) },
          { label: labels.weekday, value: weekdays[schedule.monthlyWeekday] }];
    }
  });
  protected readonly formatDateLabel = formatDateLabel;
}
