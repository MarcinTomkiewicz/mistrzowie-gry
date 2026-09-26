import type {
  Notification,
  NotificationEventType,
  NotificationPresentation,
} from '../types/notification';
import { normalizeText } from '../utils/normalize-text';

export const NOTIFICATION_RPC = {
  list: 'list_my_notifications',
  unreadCount: 'get_my_unread_notification_count',
  markRead: 'mark_my_notification_read',
  markAllRead: 'mark_all_my_notifications_read',
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
};

function adminOnboardingRoute(payload: Notification['payload'], fallback: string): string {
  const onboardingId = normalizeText(payload['onboardingId']);
  return onboardingId
    ? `/admin/coworkers/onboarding/${encodeURIComponent(onboardingId)}`
    : fallback;
}
