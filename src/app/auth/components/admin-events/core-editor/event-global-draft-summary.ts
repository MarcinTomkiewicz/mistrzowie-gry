import { Component, computed, input } from '@angular/core';

import type {
  AdminEffectivePolicyResult, AdminGlobalCalendarResult,
} from '../../../../core/interfaces/i-admin-global-event';
import type { IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { formatDateLabel } from '../../../../core/utils/date';
import { formatTimeLabel } from '../../../../core/utils/time-format';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalPolicySummary } from './event-global-policy-summary';

@Component({
  selector: 'app-event-global-draft-summary',
  imports: [EventGlobalPolicySummary],
  templateUrl: './event-global-draft-summary.html',
  host: { class: 'flex-col-start-stretch gap-md w-100' },
})
export class EventGlobalDraftSummary {
  readonly core = input.required<IEventCoreDetail>();
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly policy = input.required<AdminEffectivePolicyResult>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly formatTimeLabel = formatTimeLabel;
  protected readonly mainCity = computed(() => this.calendar().cities.find((city) => city.editionId === this.calendar().mainEditionId));
  protected readonly dates = computed(() => [...this.calendar().globalDates].sort((a, b) => a.date.localeCompare(b.date)));
  protected readonly blocks = computed(() => [...this.calendar().timeBlocks].sort((a, b) => a.position - b.position));
  protected readonly policyGroups = computed(() => [
    { key: 'global', title: this.i18n.creation().policy, values: this.policy().global },
    ...this.policy().editions.filter((edition) => Object.values(edition.override).some(Boolean)).map((edition) => ({
      key: edition.editionId,
      title: `${this.i18n.creation().effectivePolicy} - ${edition.city}`,
      values: edition.effective,
    })),
  ]);
}
