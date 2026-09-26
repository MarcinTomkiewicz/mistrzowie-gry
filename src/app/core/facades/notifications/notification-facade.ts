import { effect, ErrorHandler, inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, Subscription, timer } from 'rxjs';

import { NOTIFICATION_UNREAD_POLL_INTERVAL } from '../../configs/notifications.config';
import { Auth } from '../../services/auth/auth';
import { Notifications } from '../../services/notifications/notifications';
import { Platform } from '../../services/platform/platform';
import type { Notification } from '../../types/notification';

@Injectable({ providedIn: 'root' })
export class NotificationFacade {
  private readonly auth = inject(Auth);
  private readonly data = inject(Notifications);
  private readonly platform = inject(Platform);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly notificationState = signal<readonly Notification[]>([]);
  private readonly unreadState = signal(0);
  private readonly loadingState = signal(false);
  private requests = new Subscription();
  private listRequest: Subscription | null = null;
  private countRequest: Subscription | null = null;
  private listLimit: number | null = null;
  private pendingLoads = 0;

  readonly notifications = this.notificationState.asReadonly();
  readonly unreadCount = this.unreadState.asReadonly();
  readonly loading = this.loadingState.asReadonly();

  constructor() {
    effect((onCleanup) => {
      const userId = this.auth.userId();
      const requests = new Subscription();
      this.requests = requests;
      this.listLimit = null;
      this.notificationState.set([]);
      this.unreadState.set(0);

      onCleanup(() => {
        requests.unsubscribe();
        this.pendingLoads = 0;
        this.loadingState.set(false);
      });

      if (!userId) return;

      this.refreshUnreadCount();
      if (this.platform.isBrowser) {
        requests.add(timer(
          NOTIFICATION_UNREAD_POLL_INTERVAL,
          NOTIFICATION_UNREAD_POLL_INTERVAL,
        ).subscribe(() => this.refreshUnreadCount()));
      }
    });
  }

  loadNotifications(limit: number): void {
    this.listRequest?.unsubscribe();
    this.listLimit = limit;
    this.listRequest = this.runRequest(
      this.data.getList(limit),
      (notifications) => this.notificationState.set(notifications),
      true,
    );
  }

  refreshUnreadCount(): void {
    this.countRequest?.unsubscribe();
    this.countRequest = this.runRequest(
      this.data.getUnreadCount(),
      (count) => this.unreadState.set(count),
    );
  }

  markOneRead(notificationId: string, onSuccess?: () => void): void {
    this.runRequest(
      this.data.markRead(notificationId),
      () => {
        this.refreshAfterRead();
        onSuccess?.();
      },
      true,
    );
  }

  markAllRead(): void {
    this.runRequest(
      this.data.markAllRead(),
      () => this.refreshAfterRead(),
      true,
    );
  }

  private refreshAfterRead(): void {
    this.refreshUnreadCount();
    if (this.listLimit !== null) this.loadNotifications(this.listLimit);
  }

  private runRequest<TResult>(
    request: Observable<TResult>,
    apply: (result: TResult) => void,
    trackLoading = false,
  ): Subscription {
    const userId = this.auth.userId();
    if (!userId) return Subscription.EMPTY;

    if (trackLoading) {
      this.pendingLoads += 1;
      this.loadingState.set(true);
    }

    const subscription = request.pipe(
      finalize(() => {
        if (trackLoading) {
          this.pendingLoads -= 1;
          this.loadingState.set(this.pendingLoads > 0);
        }
      }),
    ).subscribe({
      next: (result) => {
        if (this.auth.userId() === userId) apply(result);
      },
      error: (error: unknown) => {
        if (this.auth.userId() === userId) this.errorHandler.handleError(error);
      },
    });
    this.requests.add(subscription);
    return subscription;
  }
}
