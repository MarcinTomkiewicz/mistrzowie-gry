import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { NOTIFICATION_RPC } from '../../configs/notifications.config';
import type { Notification, NotificationRpcRow } from '../../types/notification';
import { Backend } from '../backend/backend';

@Injectable({ providedIn: 'root' })
export class Notifications {
  private readonly backend = inject(Backend);

  getList(limit: number): Observable<Notification[]> {
    return this.backend.rpc<NotificationRpcRow[]>(NOTIFICATION_RPC.list, {
      p_limit: limit,
    }).pipe(
      map((rows) => rows.map((row) => ({
        id: row.id,
        eventType: row.event_type,
        payload: row.payload,
        createdAt: row.created_at,
        readAt: row.read_at,
      }))),
    );
  }

  getUnreadCount(): Observable<number> {
    return this.backend.rpc<number>(NOTIFICATION_RPC.unreadCount);
  }

  markRead(notificationId: string): Observable<void> {
    return this.backend.rpc<unknown>(NOTIFICATION_RPC.markRead, {
      p_notification_id: notificationId,
    }).pipe(map(() => void 0));
  }

  markAllRead(): Observable<void> {
    return this.backend.rpc<unknown>(NOTIFICATION_RPC.markAllRead)
      .pipe(map(() => void 0));
  }
}
