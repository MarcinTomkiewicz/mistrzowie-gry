import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { ICoworkerNotification } from '../../../../core/interfaces/i-coworker-document';
import { CoworkerNotificationCopy } from '../../../../core/types/i18n/coworker-notification';
import { formatTimestampLabel } from '../../../../core/utils/date';

@Component({
  selector: 'app-coworker-notifications',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './coworker-notifications.html',
})
export class CoworkerNotifications {
  readonly notifications = input.required<readonly ICoworkerNotification[]>();
  readonly unreadCount = input.required<number>();
  readonly copy = input.required<CoworkerNotificationCopy>();
  readonly activeMutationId = input<string | null>(null);
  readonly disabled = input(false);

  readonly markReadRequested = output<string>();

  protected readonly formatTimestampLabel = formatTimestampLabel;

  protected title(notification: ICoworkerNotification): string {
    const copy = this.copy();
    return `${copy.entities[notification.entityType]} - ${
      copy.severities[notification.severity]
    }`;
  }
}
