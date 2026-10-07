export type NotificationEventType =
  | 'onboarding_started'
  | 'questionnaire_ready_for_signature'
  | 'private_documents_added'
  | 'signed_document_submitted'
  | 'signed_document_rejected'
  | 'signed_document_accepted'
  | 'onboarding_completed'
  | 'shared_documents_assigned'
  | 'shared_documents_acknowledged'
  | 'staffing_self_application_submitted'
  | 'staffing_self_application_accepted'
  | 'staffing_self_application_rejected'
  | 'staffing_admin_proposal_created'
  | 'staffing_admin_proposal_accepted'
  | 'staffing_admin_proposal_rejected'
  | 'staffing_candidate_message_created'
  | 'staffing_final_plan_changed';

export interface StaffingRealizationNotificationPayload {
  realizationId: string;
  realizationName: string;
  gmUserId: string;
  gmDisplayName: string;
}

export interface StaffingCandidateNotificationPayload extends StaffingRealizationNotificationPayload {
  candidateId: string;
}

export interface StaffingCandidateMessageNotificationPayload extends StaffingCandidateNotificationPayload {
  messageId: string;
  authorUserId: string;
}

export type NotificationEventParams = Pick<
  StaffingRealizationNotificationPayload, 'realizationName' | 'gmDisplayName'
>;

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
  resolveParams?: (payload: Notification['payload']) => NotificationEventParams;
};
