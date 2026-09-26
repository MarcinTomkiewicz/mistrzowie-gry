import { buildSiteUrl, SITE_NAME } from '../app/core/config/site';
import { NOTIFICATION_PRESENTATION } from '../app/core/configs/notifications.config';
import { escapeHtml } from './email-html';
import { buildBrandedEmailHtml, MAIL_THEME } from './email-layout';
import emailTranslations from './i18n/pl/notification-email.json';
import type { NotificationEmailClaim, NotificationEmailTranslations } from './notification-email-types';

const emailCopy: NotificationEmailTranslations = emailTranslations;

export function buildNotificationEmail(
  notification: Pick<NotificationEmailClaim, 'event_type' | 'payload'>,
) {
  const copy = emailCopy[notification.event_type];
  const route = NOTIFICATION_PRESENTATION[notification.event_type]
    .resolveRoute(notification.payload);
  const url = buildSiteUrl(route);

  return {
    subject: `${SITE_NAME} - ${copy.subjectLabel}`,
    text: [
      copy.heading,
      '',
      copy.body,
      '',
      `${copy.ctaLabel}: ${url}`,
    ].join('\n'),
    html: buildBrandedEmailHtml({
      heading: copy.heading,
      contentHtml: `
        <p style="margin:0;line-height:1.7;">${escapeHtml(copy.body)}</p>
        <p style="margin:24px 0 0;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;background:${MAIL_THEME.crimson};color:${MAIL_THEME.white};border-radius:10px;font-weight:700;text-decoration:none;">
            ${escapeHtml(copy.ctaLabel)}
          </a>
        </p>
      `,
    }),
  };
}
