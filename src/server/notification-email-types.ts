import type { NotificationEventType } from '../app/core/types/notification';

export type NotificationEmailClaim = {
  notification_id: string;
  recipient_user_id: string;
  recipient_email: string;
  event_type: NotificationEventType;
  payload: Record<string, unknown>;
  attempt_count: number;
};
