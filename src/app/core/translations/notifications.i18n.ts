import type { NotificationEventTranslations } from '../types/i18n/notifications';
import { createScopedSectionsI18n } from './scoped.i18n';

export const NOTIFICATIONS_SCOPE = 'notifications';

export function createNotificationsI18n() {
  return createScopedSectionsI18n<{
    events: NotificationEventTranslations;
  }>(NOTIFICATIONS_SCOPE, { events: 'events' });
}
