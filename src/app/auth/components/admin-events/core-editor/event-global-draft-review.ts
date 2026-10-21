import { Component, computed, input } from '@angular/core';

import { mapEventGlobalDraftToPayload, type EventGlobalDraftForm } from '../../../../core/factories/event-global-draft-form.factory';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatTimeRangeLabel } from '../../../../core/utils/time-format';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalPolicySummary } from './event-global-policy-summary';

@Component({
  selector: 'app-event-global-draft-review',
  imports: [EventGlobalPolicySummary],
  templateUrl: './event-global-draft-review.html',
  host: { class: 'flex-col-start-stretch gap-md w-100' },
})
export class EventGlobalDraftReview {
  readonly form = input.required<EventGlobalDraftForm>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly value = computed(() => mapEventGlobalDraftToPayload(this.form()));
  protected readonly date = computed(() => this.value().schedule.date);
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
}
