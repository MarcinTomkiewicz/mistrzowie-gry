import { Component, input } from '@angular/core';

import type { AdminGlobalEventPageFieldError } from '../../../../core/interfaces/i-admin-global-event-preview';
import type { AdminGlobalCalendarResult } from '../../../../core/interfaces/i-admin-global-event';
import { createEventCoreEditorI18n } from './core-editor.i18n';

export function selectEventGlobalDiagnosticIssues(issues: readonly AdminGlobalEventPageFieldError[],
  fields: readonly AdminGlobalEventPageFieldError['field'][], editionId?: string) {
  return issues.filter(issue => fields.includes(issue.field) &&
    (editionId === undefined || !('editionId' in issue) || issue.editionId === editionId));
}

@Component({
  selector: 'app-event-global-diagnostic-messages',
  template: `
    @for (issue of issues(); track $index) {
      <p class="error-text m-0 text-wrap-anywhere" role="status">
        @if ('editionId' in issue && cities().length) { <strong>{{ cityName(issue.editionId) }}: </strong> }
        {{ i18n.diagnostics().messages[issue.code] }}
        @if ('detail' in issue) { <span class="d-block text-pre-line">{{ issue.detail }}</span> }
      </p>
    }
  `,
  host: { class: 'd-contents' },
})
export class EventGlobalDiagnosticMessages {
  readonly issues = input<readonly AdminGlobalEventPageFieldError[]>([]);
  readonly cities = input<AdminGlobalCalendarResult['cities']>([]);
  protected readonly i18n = createEventCoreEditorI18n();

  protected cityName(editionId: string): string {
    return this.cities().find(city => city.editionId === editionId)?.city ?? editionId;
  }
}
