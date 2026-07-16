const mailTheme = {
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

export function buildContactEmailHtml(data: {
  resolvedTopic: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  message: string;
}): string {
  return `
    <div style="margin:0;padding:24px;background:${mailTheme.graphite};font-family:Arial,sans-serif;color:${mailTheme.paperText};">
      <div style="max-width:720px;margin:0 auto;background:linear-gradient(180deg, ${mailTheme.paperBg} 0%, ${mailTheme.paperBgAlt} 100%);border:1px solid ${mailTheme.paperBorder};border-radius:16px;overflow:hidden;">
        <div style="padding:20px 24px;background:${mailTheme.crimson};color:${mailTheme.white};border-bottom:1px solid ${mailTheme.border};border-radius:16px;">
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${mailTheme.textMuted};margin-bottom:8px;border-radius:16px;">
            Mistrzowie Gry
          </div>
          <h1 style="margin:0;font-size:24px;line-height:1.2;color:${mailTheme.white};">
            Nowa wiadomość z formularza kontaktowego
          </h1>
        </div>

        <div style="padding:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;font-weight:700;width:180px;color:${mailTheme.ink};">Temat</td>
              <td style="padding:10px 0;color:${mailTheme.ink};">${escapeHtml(data.resolvedTopic)}</td>
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
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
