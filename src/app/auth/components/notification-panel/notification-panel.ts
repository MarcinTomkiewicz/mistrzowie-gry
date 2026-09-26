import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { provideTranslocoScope, TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';

import { NOTIFICATION_PRESENTATION } from '../../../core/configs/notifications.config';
import { NotificationFacade } from '../../../core/facades/notifications/notification-facade';
import { createCommonStatusI18n } from '../../../core/translations/common.i18n';
import {
  createNotificationsI18n,
  NOTIFICATIONS_SCOPE,
} from '../../../core/translations/notifications.i18n';
import type { Notification } from '../../../core/types/notification';
import { formatTimestampLabel } from '../../../core/utils/date';

@Component({
  selector: 'app-notification-panel',
  imports: [ButtonModule, TranslocoPipe],
  templateUrl: './notification-panel.html',
  providers: [provideTranslocoScope(NOTIFICATIONS_SCOPE, 'common')],
})
export class NotificationPanel {
  private readonly router = inject(Router);
  readonly closed = output<void>();
  protected readonly notifications = inject(NotificationFacade);
  protected readonly i18n = createNotificationsI18n();
  protected readonly status = createCommonStatusI18n();
  protected readonly presentation = NOTIFICATION_PRESENTATION;
  protected readonly formatTimestamp = formatTimestampLabel;

  open(): void {
    this.notifications.loadNotifications(50);
    this.notifications.refreshUnreadCount();
  }

  protected goTo(notification: Notification): void {
    if (notification.readAt !== null) {
      this.navigate(notification);
      return;
    }

    this.notifications.markOneRead(notification.id, () => this.navigate(notification));
  }

  private navigate(notification: Notification): void {
    const route = this.presentation[notification.eventType].resolveRoute(notification.payload);
    void this.router.navigateByUrl(route);
    this.closed.emit();
  }
}
