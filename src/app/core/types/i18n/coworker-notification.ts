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
  severities: Readonly<Record<string, string>>;
  entities: Readonly<Record<string, string>>;
};
