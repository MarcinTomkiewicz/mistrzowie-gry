import notificationTranslations from '../../public/assets/i18n/pl/notifications.json';
import { buildSiteUrl, SITE_NAME } from '../app/core/config/site';
import { NOTIFICATION_PRESENTATION } from '../app/core/configs/notifications.config';
import type { NotificationEventTranslations } from '../app/core/types/i18n/notifications';
import { escapeHtml } from './email-html';
import emailTranslations from './i18n/pl/notification-email.json';
import type { NotificationEmailClaim } from './notification-email-types';

const eventLabels: NotificationEventTranslations = notificationTranslations.events;

export function buildNotificationEmail(
  notification: Pick<NotificationEmailClaim, 'event_type' | 'payload'>,
) {
  const label = eventLabels[notification.event_type];
  const route = NOTIFICATION_PRESENTATION[notification.event_type]
    .resolveRoute(notification.payload);
  const url = buildSiteUrl(route);

  return {
    subject: `${SITE_NAME} - ${label}`,
    text: [
      label,
      '',
      emailTranslations.body,
      '',
      `${emailTranslations.goToApplication}: ${url}`,
    ].join('\n'),
    html: `
      <div lang="pl">
        <h1>${escapeHtml(label)}</h1>
        <p>${escapeHtml(emailTranslations.body)}</p>
        <p><a href="${escapeHtml(url)}">${escapeHtml(emailTranslations.goToApplication)}</a></p>
      </div>
    `,
  };
}
