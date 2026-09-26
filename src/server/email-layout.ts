import {
  buildSiteUrl,
  PUBLIC_CONTACT_EMAIL,
  SITE_NAME,
  SITE_URL,
} from '../app/core/config/site';
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
  const logoUrl = buildSiteUrl('/logo/logoMG-transparent.png');

  return `
    <div lang="pl" style="margin:0;background:${MAIL_THEME.graphite};font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${MAIL_THEME.graphite}" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:24px 12px;">
            <!--[if mso]><table role="presentation" width="720" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${MAIL_THEME.paperBg}" style="width:100%;max-width:720px;border:1px solid ${MAIL_THEME.paperBorder};border-radius:16px;border-spacing:0;color:${MAIL_THEME.paperText};">
              <tr>
                <td bgcolor="${MAIL_THEME.crimson}" style="padding:24px;border-radius:16px 16px 0 0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td width="88" valign="middle" style="width:88px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="${MAIL_THEME.paperBg}" style="border-radius:10px;">
                          <tr>
                            <td style="padding:4px;">
                              <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(SITE_NAME)}" width="80" height="80" style="display:block;width:80px;height:80px;border:0;color:${MAIL_THEME.ink};font-size:12px;">
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td valign="middle" style="padding-left:20px;color:${MAIL_THEME.white};font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;line-height:1.3;">
                        ${escapeHtml(SITE_NAME)}
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin:24px 0 0;color:${MAIL_THEME.white};font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;line-height:1.4;">
                    ${escapeHtml(data.heading)}
                  </h1>
                </td>
              </tr>
              <tr>
                <td bgcolor="${MAIL_THEME.paperBg}" style="padding:28px 24px;color:${MAIL_THEME.paperText};font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.7;word-wrap:break-word;">
                  ${data.contentHtml}
                </td>
              </tr>
              <tr>
                <td bgcolor="${MAIL_THEME.paperBgAlt}" style="padding:20px 24px;border-top:1px solid ${MAIL_THEME.paperBorder};border-radius:0 0 16px 16px;color:${MAIL_THEME.ink};font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.8;">
                  <strong>${escapeHtml(SITE_NAME)}</strong><br>
                  <a href="${escapeHtml(SITE_URL)}" style="color:${MAIL_THEME.crimson};text-decoration:underline;">${escapeHtml(SITE_URL)}</a><br>
                  <a href="${escapeHtml(`mailto:${PUBLIC_CONTACT_EMAIL}`)}" style="color:${MAIL_THEME.crimson};text-decoration:underline;">${escapeHtml(PUBLIC_CONTACT_EMAIL)}</a>
                </td>
              </tr>
            </table>
            <!--[if mso]></td></tr></table><![endif]-->
          </td>
        </tr>
      </table>
    </div>
  `;
}
