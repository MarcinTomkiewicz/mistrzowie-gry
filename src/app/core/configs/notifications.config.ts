import type {
  Notification,
  NotificationEventParams,
  NotificationEventType,
  NotificationPresentation,
  StaffingCandidateMessageNotificationPayload,
} from '../types/notification';
import { formatMonthLabel, isValidIsoMonth } from '../utils/date';
import { normalizeText } from '../utils/normalize-text';
import { GM_STAFFING_HUB_ROUTE } from './staffing-realization.config';

export const NOTIFICATION_RPC = {
  list: 'list_my_notifications',
  unreadCount: 'get_my_unread_notification_count',
  markRead: 'mark_my_notification_read',
  markAllRead: 'mark_all_my_notifications_read',
  dismiss: 'dismiss_my_notification',
  dismissAllRead: 'dismiss_all_my_read_notifications',
} as const;

export const NOTIFICATION_UNREAD_POLL_INTERVAL = 60_000;

export const NOTIFICATION_PRESENTATION: Record<NotificationEventType, NotificationPresentation> = {
  onboarding_started: {
    translationKey: 'notifications.events.onboarding_started',
    resolveRoute: () => '/auth/coworker/questionnaire',
  },
  questionnaire_ready_for_signature: {
    translationKey: 'notifications.events.questionnaire_ready_for_signature',
    resolveRoute: () => '/auth/coworker/documents',
  },
  private_documents_added: {
    translationKey: 'notifications.events.private_documents_added',
    resolveRoute: () => '/auth/coworker/documents',
  },
  signed_document_submitted: {
    translationKey: 'notifications.events.signed_document_submitted',
    resolveRoute: (payload) => adminOnboardingRoute(payload, '/admin/coworkers/onboarding'),
  },
  signed_document_rejected: {
    translationKey: 'notifications.events.signed_document_rejected',
    resolveRoute: () => '/auth/coworker/documents',
  },
  signed_document_accepted: {
    translationKey: 'notifications.events.signed_document_accepted',
    resolveRoute: () => '/auth/coworker/documents',
  },
  onboarding_completed: {
    translationKey: 'notifications.events.onboarding_completed',
    resolveRoute: () => '/auth/coworker/shared-documents',
  },
  shared_documents_assigned: {
    translationKey: 'notifications.events.shared_documents_assigned',
    resolveRoute: () => '/auth/coworker/shared-documents',
  },
  shared_documents_acknowledged: {
    translationKey: 'notifications.events.shared_documents_acknowledged',
    resolveRoute: (payload) => adminOnboardingRoute(payload, '/admin/coworkers/shared-documents'),
  },
  staffing_self_application_submitted: {
    translationKey: 'notifications.events.staffing_self_application_submitted',
    resolveRoute: adminStaffingCandidateRoute,
    resolveParams: getStaffingNotificationParams,
  },
  staffing_self_application_accepted: {
    translationKey: 'notifications.events.staffing_self_application_accepted',
    resolveRoute: gmStaffingParticipationRoute,
    resolveParams: getStaffingNotificationParams,
  },
  staffing_self_application_rejected: {
    translationKey: 'notifications.events.staffing_self_application_rejected',
    resolveRoute: gmStaffingParticipationRoute,
    resolveParams: getStaffingNotificationParams,
  },
  staffing_admin_proposal_created: {
    translationKey: 'notifications.events.staffing_admin_proposal_created',
    resolveRoute: gmStaffingParticipationRoute,
    resolveParams: getStaffingNotificationParams,
  },
  staffing_admin_proposal_accepted: {
    translationKey: 'notifications.events.staffing_admin_proposal_accepted',
    resolveRoute: adminStaffingCandidateRoute,
    resolveParams: getStaffingNotificationParams,
  },
  staffing_admin_proposal_rejected: {
    translationKey: 'notifications.events.staffing_admin_proposal_rejected',
    resolveRoute: adminStaffingCandidateRoute,
    resolveParams: getStaffingNotificationParams,
  },
  staffing_candidate_message_created: {
    translationKey: 'notifications.events.staffing_candidate_message_created',
    resolveRoute: (payload) =>
      readNotificationPayloadText(payload, 'authorUserId') === readNotificationPayloadText(payload, 'gmUserId')
        ? adminStaffingCandidateRoute(payload)
        : gmStaffingParticipationRoute(payload),
    resolveParams: getStaffingNotificationParams,
  },
  staffing_final_plan_changed: {
    translationKey: 'notifications.events.staffing_final_plan_changed',
    resolveRoute: gmStaffingParticipationRoute,
    resolveParams: getStaffingNotificationParams,
  },
  staffing_candidate_session_proposals_changed: {
    translationKey: 'notifications.events.staffing_candidate_session_proposals_changed',
    resolveRoute: adminStaffingCandidateRoute,
    resolveParams: getStaffingNotificationParams,
  },
  gm_availability_month_reminder: {
    translationKey: 'notifications.events.gm_availability_month_reminder',
    resolveRoute: (payload) =>
      `/auth/gm/profile/availability?month=${encodeURIComponent(readNotificationTargetMonth(payload))}`,
    resolveParams: getMonthReminderParams,
  },
  work_log_month_reminder: {
    translationKey: 'notifications.events.work_log_month_reminder',
    resolveRoute: (payload) =>
      `/auth/gm/work-log?month=${encodeURIComponent(readNotificationTargetMonth(payload))}`,
    resolveParams: getMonthReminderParams,
  },
};

function adminStaffingCandidateRoute(payload: Notification['payload']): string {
  const realizationId = encodeURIComponent(readNotificationPayloadText(payload, 'realizationId'));
  const candidateId = encodeURIComponent(readNotificationPayloadText(payload, 'candidateId'));
  return `/admin/staffing/${realizationId}/board?candidateId=${candidateId}`;
}

function gmStaffingParticipationRoute(payload: Notification['payload']): string {
  const realizationId = encodeURIComponent(readNotificationPayloadText(payload, 'realizationId'));
  return `${GM_STAFFING_HUB_ROUTE}/${realizationId}/participation`;
}

function adminOnboardingRoute(payload: Notification['payload'], fallback: string): string {
  const onboardingId = normalizeText(payload['onboardingId']);
  return onboardingId
    ? `/admin/coworkers/onboarding/${encodeURIComponent(onboardingId)}`
    : fallback;
}

function readNotificationPayloadText(
  payload: Notification['payload'],
  key: keyof StaffingCandidateMessageNotificationPayload,
): string {
  const value = payload[key];
  if (typeof value !== 'string') {
    throw new TypeError(`Invalid notification payload: ${key} must be a string.`);
  }
  return value;
}

function getStaffingNotificationParams(payload: Notification['payload']): NotificationEventParams {
  return {
    realizationName: readNotificationPayloadText(payload, 'realizationName'),
    gmDisplayName: readNotificationPayloadText(payload, 'gmDisplayName'),
  };
}

function readNotificationTargetMonth(payload: Notification['payload']): string {
  const targetMonth = payload['targetMonth'];
  if (!isValidIsoMonth(targetMonth)) {
    throw new TypeError('Invalid notification payload: targetMonth must be a valid YYYY-MM string.');
  }
  return targetMonth;
}

function getMonthReminderParams(payload: Notification['payload']): NotificationEventParams {
  return { targetMonth: formatMonthLabel(readNotificationTargetMonth(payload)) };
}
