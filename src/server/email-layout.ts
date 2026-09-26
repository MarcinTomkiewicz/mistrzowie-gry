import { SITE_NAME } from '../app/core/config/site';
import { escapeHtml } from './email-html';

export const MAIL_THEME = {
  ink: '#222222',
  crimson: '#750a0c',
  graphite: '#2f2f33',
  white: '#ffffff',
  border: '#3a3a3f',
  textMuted: 'rgba(255,255,255,0.65)',
  paperBg: '#f4e9cf',
  paperBgAlt: '#e5d0a2',
  paperText: '#222222',
  paperBorder: 'rgba(34,34,34,0.25)',
} as const;

export function buildBrandedEmailHtml(data: {
  heading: string;
  contentHtml: string;
}): string {
  return `
    <div lang="pl" style="margin:0;padding:24px;background:${MAIL_THEME.graphite};font-family:Arial,sans-serif;color:${MAIL_THEME.paperText};">
      <div style="max-width:720px;margin:0 auto;background:linear-gradient(180deg, ${MAIL_THEME.paperBg} 0%, ${MAIL_THEME.paperBgAlt} 100%);border:1px solid ${MAIL_THEME.paperBorder};border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:${MAIL_THEME.crimson};color:${MAIL_THEME.white};border-bottom:1px solid ${MAIL_THEME.border};border-radius:16px;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${MAIL_THEME.textMuted};margin-bottom:8px;border-radius:16px;">
            ${escapeHtml(SITE_NAME)}
          </div>
          <h1 style="margin:0;font-size:24px;line-height:1.2;color:${MAIL_THEME.white};">
            ${escapeHtml(data.heading)}
          </h1>
        </div>
        <div style="padding:24px;">
          ${data.contentHtml}
        </div>
      </div>
    </div>
  `;
}
