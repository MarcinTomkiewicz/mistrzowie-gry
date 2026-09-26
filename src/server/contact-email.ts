import { escapeHtml } from './email-html';
import { buildBrandedEmailHtml, MAIL_THEME as mailTheme } from './email-layout';

export function buildContactEmailHtml(data: {
  subject: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  message: string;
}): string {
  return buildBrandedEmailHtml({
    heading: 'Nowa wiadomość z formularza kontaktowego',
    contentHtml: `
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;font-weight:700;width:180px;color:${mailTheme.ink};">Temat</td>
              <td style="padding:10px 0;color:${mailTheme.ink};">${escapeHtml(data.subject)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:700;color:${mailTheme.ink};">Imię i nazwisko</td>
              <td style="padding:10px 0;color:${mailTheme.ink};">${escapeHtml(data.fullName)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:700;color:${mailTheme.ink};">Email</td>
              <td style="padding:10px 0;">
                <a href="mailto:${escapeHtml(data.email)}" style="color:${mailTheme.crimson};text-decoration:none;font-weight:700;">
                  ${escapeHtml(data.email)}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:700;color:${mailTheme.ink};">Telefon</td>
              <td style="padding:10px 0;color:${mailTheme.ink};">${escapeHtml(data.phone || '-')}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;font-weight:700;color:${mailTheme.ink};">Firma</td>
              <td style="padding:10px 0;color:${mailTheme.ink};">${escapeHtml(data.companyName || '-')}</td>
            </tr>
          </table>

          <div style="margin-top:24px;">
            <div style="margin-bottom:10px;font-weight:700;font-size:16px;color:${mailTheme.crimson};">
              Treść wiadomości
            </div>
            <div style="padding:16px;border:1px solid ${mailTheme.paperBorder};border-radius:10px;background:rgba(255,255,255,0.35);line-height:1.7;color:${mailTheme.ink};">
              ${escapeHtml(data.message).replace(/\n/g, '<br>')}
            </div>
          </div>
    `,
  });
}
