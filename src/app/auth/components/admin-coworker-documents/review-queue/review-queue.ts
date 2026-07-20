import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';

import { STATUS_BADGE_CLASS } from '../../../../core/configs/badge-class.config';
import { IAdminCoworkerReviewQueueItem } from '../../../../core/interfaces/i-admin-coworker-document';
import { formatTimestampLabel } from '../../../../core/utils/date';
import { ContextHelp } from '../../../../public/common/context-help/context-help';
import { createAdminCoworkerDocumentsI18n } from '../private-documents/private-documents.i18n';

@Component({
  selector: 'app-admin-coworker-review-queue',
  standalone: true,
  imports: [RouterLink, ButtonModule, TableModule, ContextHelp],
  templateUrl: './review-queue.html',
})
export class ReviewQueue {
  readonly items = input.required<readonly IAdminCoworkerReviewQueueItem[]>();
  readonly disabled = input(false);

  protected readonly i18n = createAdminCoworkerDocumentsI18n();
  protected readonly tableItems = computed(() => [...this.items()]);
  protected readonly formatTimestampLabel = formatTimestampLabel;

  protected statusBadge(item: IAdminCoworkerReviewQueueItem): string {
    return `tag-badge ${STATUS_BADGE_CLASS[item.status]}`;
  }

  protected statusLabel(item: IAdminCoworkerReviewQueueItem): string {
    return this.i18n.review().statuses.documents[item.status];
  }
}
