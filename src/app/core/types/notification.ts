export type NotificationEventType =
  | 'onboarding_started'
  | 'questionnaire_ready_for_signature'
  | 'private_documents_added'
  | 'signed_document_submitted'
  | 'signed_document_rejected'
  | 'signed_document_accepted'
  | 'onboarding_completed'
  | 'shared_documents_assigned'
  | 'shared_documents_acknowledged';

export type Notification = {
  id: string;
  eventType: NotificationEventType;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
};

export type NotificationRpcRow = {
  id: Notification['id'];
  event_type: Notification['eventType'];
  payload: Notification['payload'];
  created_at: Notification['createdAt'];
  read_at: Notification['readAt'];
};

export type NotificationPresentation = {
  translationKey: `notifications.events.${NotificationEventType}`;
  resolveRoute: (payload: Notification['payload']) => string;
};
