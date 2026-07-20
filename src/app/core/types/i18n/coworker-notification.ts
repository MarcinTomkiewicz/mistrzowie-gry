import {
  CoworkerNotificationEntityType,
  CoworkerNotificationSeverity,
} from '../coworker-document';

export type CoworkerNotificationCopy = {
  title: string;
  description: string;
  unreadCount: string;
  read: string;
  unread: string;
  createdAt: string;
  technicalCode: string;
  markRead: string;
  emptyTitle: string;
  emptyDescription: string;
  severities: Record<CoworkerNotificationSeverity, string>;
  entities: Record<CoworkerNotificationEntityType, string>;
};
