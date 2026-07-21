import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { IAdminOperationalDocumentListItem } from '../../../../core/interfaces/i-admin-coworker-operational-document';
import { AdminOperationalTableCopy } from '../../../../core/types/i18n/admin-coworker-operational-document';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { ContextHelp } from '../../../../public/common/context-help/context-help';

@Component({
  selector: 'app-admin-operational-document-table',
  standalone: true,
  imports: [RouterLink, ButtonModule, TableModule, ContextHelp],
  templateUrl: './document-table.html',
})
export class DocumentTable {
  readonly rows = input.required<readonly IAdminOperationalDocumentListItem[]>();
  readonly copy = input.required<AdminOperationalTableCopy>();

  protected readonly formatTimestampLabel = formatTimestampLabel;
  protected readonly tableItems = computed(() =>
    this.rows().map((document) => ({
      document,
      statusClass: STATUS_BADGE_CLASS[document.status],
      statusLabel: this.copy().statuses.documents[document.status],
      currentActionModeLabel: document.currentActionMode === null
        ? null
        : this.copy().statuses.actionModes[document.currentActionMode],
      unpublishedStatusClass: document.unpublishedVersion === null
        ? null
        : STATUS_BADGE_CLASS[document.unpublishedVersion.status],
      unpublishedStatusLabel: document.unpublishedVersion === null
        ? null
        : this.copy().statuses.versions[document.unpublishedVersion.status],
    })),
  );
}
