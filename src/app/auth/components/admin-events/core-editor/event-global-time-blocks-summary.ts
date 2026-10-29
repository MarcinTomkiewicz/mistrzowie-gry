import { Component, computed, input } from '@angular/core';

import type { GlobalTimeBlockInput } from '../../../../core/interfaces/i-admin-global-event';
import { formatTimeRangeLabel } from '../../../../core/utils/time-format';
import { createEventCoreEditorI18n } from './core-editor.i18n';

@Component({
  selector: 'app-event-global-time-blocks-summary',
  template: `
    @for (block of orderedBlocks(); track block.position) {
      <div class="flex-col-start-stretch gap-xs border radius-sm p-sm min-w-0">
        <strong class="text-wrap-anywhere">{{ block.label }}</strong>
        <div class="flex-row-between-center flex-wrap gap-sm">
          <span class="text-nowrap">{{ formatTimeRangeLabel(block.startTime, block.endTime) }}</span>
          <span>{{ i18n.creation().requiredGmCount }}: {{ block.requiredGmCount }}</span>
        </div>
        @if (showDayOffsets()) {
          <div class="flex-row-start-center flex-wrap gap-sm">
            <span>{{ i18n.baseTimeBlocks().startDayOffset }}: {{ block.startDayOffset }}</span>
            <span>{{ i18n.baseTimeBlocks().endDayOffset }}: {{ block.endDayOffset }}</span>
          </div>
        }
      </div>
    }
  `,
  host: { class: 'flex-col-start-stretch gap-sm w-100 min-w-0' },
})
export class EventGlobalTimeBlocksSummary {
  readonly blocks = input.required<readonly GlobalTimeBlockInput[]>();
  readonly showDayOffsets = input(false);
  protected readonly i18n = createEventCoreEditorI18n();
  protected readonly formatTimeRangeLabel = formatTimeRangeLabel;
  protected readonly orderedBlocks = computed(() => [...this.blocks()].sort((a, b) => a.position - b.position));
}
