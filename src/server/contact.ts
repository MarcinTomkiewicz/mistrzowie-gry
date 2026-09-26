import type express from 'express';

import { buildContactEmailHtml } from './contact-email';
import { createMailerTransport } from './mail-transport';

type ContactPayload = {
  subject?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  message?: string;
  website?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function registerContactRoute(app: express.Express): void {
  app.post('/api/contact', async (req, res) => {
    const body = (req.body ?? {}) as ContactPayload;

    const subject = body.subject?.trim() || '';
    const firstName = body.firstName?.trim() || '';
    const lastName = body.lastName?.trim() || '';
    const companyName = body.companyName?.trim() || '';
    const email = body.email?.trim() || '';
    const phone = body.phone?.trim() || '';
    const message = body.message?.trim() || '';
    const website = body.website?.trim() || '';

    if (website) {
      return res.status(200).json({ ok: true });
    }

    if (!subject || !firstName || !lastName || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Brak wymaganych pól.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: 'Niepoprawny adres e-mail.',
      });
    }

    if (
      firstName.length > 120 ||
      lastName.length > 120 ||
      companyName.length > 200 ||
      email.length > 320 ||
      phone.length > 50 ||
      subject.length > 200 ||
      message.length < 20 ||
      message.length > 5000
    ) {
      return res.status(400).json({
        ok: false,
        error: 'Jedno z pól ma niepoprawną długość.',
      });
    }

    try {
      const transporter = createMailerTransport();

      const to =
        process.env['CONTACT_TO']?.trim() || 'kontakt@mistrzowie-gry.pl';
      const from =
        process.env['MAIL_FROM']?.trim() || 'kontakt@mistrzowie-gry.pl';
      const siteName = process.env['MAIL_FROM_NAME']?.trim() || 'Mistrzowie Gry';

      const fullName = `${firstName} ${lastName}`.trim();
      await transporter.sendMail({
        from: `"${siteName} - formularz kontaktowy" <${from}>`,
        to,
        replyTo: `"${fullName}" <${email}>`,
        subject: `[Kontakt] ${subject}`,
        text: [
          'Nowa wiadomość z formularza kontaktowego',
          '',
          `Temat: ${subject}`,
          `Imię i nazwisko: ${fullName}`,
          `Email: ${email}`,
          `Telefon: ${phone || '-'}`,
          `Firma: ${companyName || '-'}`,
          '',
          'Treść:',
          message,
        ].join('\n'),
        html: buildContactEmailHtml({
          subject,
          fullName,
          email,
          phone,
          companyName,
          message,
        }),
      });

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[CONTACT FORM ERROR]', err);

      return res.status(500).json({
        ok: false,
        error: 'Nie udało się wysłać wiadomości.',
      });
    }
  });
}
