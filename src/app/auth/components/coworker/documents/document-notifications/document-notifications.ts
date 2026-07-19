import { Component, input, output } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { ICoworkerNotification } from '../../../../../core/interfaces/i-coworker-document';
import { formatTimestampLabel } from '../../../../../core/utils/date';
import { createDocumentsI18n } from '../documents.i18n';

@Component({
  selector: 'app-document-notifications',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './document-notifications.html',
})
export class DocumentNotifications {
  readonly notifications = input.required<readonly ICoworkerNotification[]>();
  readonly unreadCount = input.required<number>();
  readonly activeMutationId = input<string | null>(null);
  readonly disabled = input(false);

  readonly markReadRequested = output<string>();

  protected readonly i18n = createDocumentsI18n();
  protected readonly formatTimestampLabel = formatTimestampLabel;

  protected title(notification: ICoworkerNotification): string {
    const statuses = this.i18n.statuses();
    return `${statuses.notificationEntities[notification.entityType]} - ${
      statuses.notificationSeverities[notification.severity]
    }`;
  }
}
