import { Component, input } from '@angular/core';

import { TranslocoPipe } from '@jsverse/transloco';

import type { CommercialPagePublicationIssue } from '../../../../core/types/commercial-page-admin';

@Component({
  selector: 'app-commercial-publication-issue-messages',
  imports: [TranslocoPipe],
  template: `
    @if (issues().length) {
      <div class="flex-col-start-stretch gap-xs w-100">
        @for (issue of issues(); track issue.path + issue.code + $index) {
          <small class="error-text">
            {{ ('common.' + issue.messageKey) | transloco }}
          </small>
        }
      </div>
    }
  `,
})
export class CommercialPublicationIssueMessages {
  readonly issues = input<readonly CommercialPagePublicationIssue[]>([]);
}
