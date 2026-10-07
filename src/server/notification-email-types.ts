import type { Notification } from '../app/core/types/notification';

export type NotificationEmailClaim = {
  notification_id: string;
  recipient_user_id: string;
  recipient_email: string;
  event_type: Notification['eventType'];
  payload: Notification['payload'];
  attempt_count: number;
};

export type NotificationEmailTranslations = Record<Notification['eventType'], {
  subjectLabel: string;
  heading: string;
  body: string;
  ctaLabel: string;
}>;
