import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { join } from 'node:path';

dotenv.config({
  path: join(import.meta.dirname, '../.env'),
});

const browserDistFolder = join(import.meta.dirname, '../browser');

const mailTheme = {
  ink: '#222222',
  crimson: '#750a0c',
  graphite: '#2f2f33',
  bronze: '#88452e',
  antique: '#c9a44c',
  white: '#ffffff',
  danger: '#8d0e06',
  success: '#6e8f2a',
  border: '#3a3a3f',
  textMuted: 'rgba(255,255,255,0.65)',
  paperBg: '#f4e9cf',
  paperBgAlt: '#e5d0a2',
  paperText: '#222222',
  paperBorder: 'rgba(34,34,34,0.25)',
} as const;

type ContactPayload = {
  topic?: string;
  topicCustom?: string;
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

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createMailerTransport() {
  const host = process.env['MAIL_HOST']?.trim() || 'ssl0.ovh.net';
  const port = Number(process.env['MAIL_PORT'] || 465);
  const user =
    process.env['MAIL_USER']?.trim() || 'kontakt@mistrzowie-gry.pl';
  const pass = getRequiredEnv('MAIL_PASSWORD');

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export function app(): express.Express {
  const app = express();
  const angularApp = new AngularNodeAppEngine();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '200kb' }));

  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

  app.post('/api/contact', async (req, res) => {
    const body = (req.body ?? {}) as ContactPayload;

    const topic = body.topic?.trim() || '';
    const topicCustom = body.topicCustom?.trim() || '';
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

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Brak wymaganych pól.',
      });
    }

    if (topic === 'other' && !topicCustom) {
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
      topic.length > 100 ||
      topicCustom.length > 200 ||
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
      const resolvedTopic =
        topic === 'other' ? topicCustom || 'Inny temat' : topic || 'Bez tematu';

      await transporter.sendMail({
        from: `"${siteName} – formularz kontaktowy" <${from}>`,
        to,
        replyTo: `"${fullName}" <${email}>`,
        subject: `[Kontakt] ${resolvedTopic}`,
        text: [
          'Nowa wiadomość z formularza kontaktowego',
          '',
          `Temat: ${resolvedTopic}`,
          `Imię i nazwisko: ${fullName}`,
          `Email: ${email}`,
          `Telefon: ${phone || '-'}`,
          `Firma: ${companyName || '-'}`,
          '',
          'Treść:',
          message,
        ].join('\n'),
        html: buildContactEmailHtml({
          resolvedTopic,
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

  app.use((req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
  });

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('[SSR ERROR]', err);
      res.status(500).send('Wewnętrzny błąd serwera');
    },
  );

  return app;
}

function run(): void {
  const port = Number(process.env['PORT'] || 4100);
  const server = app();

  server.listen(port, '127.0.0.1', () => {
    console.log(`Node Express server listening on http://127.0.0.1:${port}`);
  });
}

run();

export const reqHandler = createNodeRequestHandler(app());

function buildContactEmailHtml(data: {
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