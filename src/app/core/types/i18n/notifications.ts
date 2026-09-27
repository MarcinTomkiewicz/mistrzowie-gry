import type { NotificationEventType } from '../notification';

export type NotificationEventTranslations = Record<NotificationEventType, string>;

export interface NotificationUiTranslations {
  title: string;
  markAllRead: string;
  dismissAllRead: string;
  empty: string;
  goTo: string;
  buttonLabel: string;
  read: string;
  unread: string;
}
