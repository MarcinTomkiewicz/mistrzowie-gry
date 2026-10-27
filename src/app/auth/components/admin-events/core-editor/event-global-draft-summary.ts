import { Component, computed, input } from '@angular/core';

import type {
  AdminEffectivePolicyResult, AdminGlobalCalendarResult,
} from '../../../../core/interfaces/i-admin-global-event';
import type { IAdminEventDetail, IEventCoreDetail } from '../../../../core/interfaces/i-event-admin';
import { formatDateLabel } from '../../../../core/utils/date';
import { createEventCoreEditorI18n } from './core-editor.i18n';
import { EventGlobalPolicySummary } from './event-global-policy-summary';
import { EventGlobalTimeBlocksSummary } from './event-global-time-blocks-summary';

@Component({
  selector: 'app-event-global-draft-summary',
  imports: [EventGlobalPolicySummary, EventGlobalTimeBlocksSummary],
  templateUrl: './event-global-draft-summary.html',
  host: { class: 'd-block w-100 min-w-0' },
})
export class EventGlobalDraftSummary {
  readonly step = input(6);
  readonly core = input.required<IEventCoreDetail>();
  readonly mainEdition = input.required<IAdminEventDetail>();
  readonly calendar = input.required<AdminGlobalCalendarResult>();
  readonly policy = input.required<AdminEffectivePolicyResult>();
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly formatDateLabel = formatDateLabel;
  protected readonly mainCity = computed(() => this.calendar().cities.find((city) => city.editionId === this.calendar().mainEditionId));
  protected readonly dates = computed(() => [...this.calendar().datedTimeBlocks].sort((a, b) => a.date.localeCompare(b.date)));
  protected readonly policyGroups = computed(() => [
    { key: 'global', title: this.i18n.creation().policy, values: this.policy().global },
    ...this.policy().editions.filter((edition) => Object.values(edition.override).some(Boolean)).map((edition) => ({
      key: edition.editionId,
      title: `${this.i18n.creation().effectivePolicy} - ${edition.city}`,
      values: edition.effective,
    })),
  ]);
}
