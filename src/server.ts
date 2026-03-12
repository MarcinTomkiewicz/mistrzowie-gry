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

type ContactPayload = {
  topic?: string;
  topicCustom?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  message?: string;
  website?: string; // honeypot
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

  /**
   * Serve static files from /browser
   * e.g. /icons/read.svg, /theme/dark/brand.avif
   */
  app.use(
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    }),
  );

  /**
   * Contact form endpoint
   */
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
    const website = body.website?.trim() || ''; // honeypot

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
        topic === 'other' ? `Inny: ${topicCustom || '-'}` : topic || '-';

      await transporter.sendMail({
        from: `"${siteName}" <${from}>`,
        to,
        replyTo: email,
        subject: `Nowa wiadomość z formularza kontaktowego`,
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
        html: `
          <h2>Nowa wiadomość z formularza kontaktowego</h2>
          <p><strong>Temat:</strong> ${escapeHtml(resolvedTopic)}</p>
          <p><strong>Imię i nazwisko:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Telefon:</strong> ${escapeHtml(phone || '-')}</p>
          <p><strong>Firma:</strong> ${escapeHtml(companyName || '-')}</p>
          <p><strong>Treść:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        `,
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

  /**
   * Handle all other requests by rendering the Angular application.
   */
  app.use((req, res, next) => {
    angularApp
      .handle(req)
      .then((response) =>
        response ? writeResponseToNodeResponse(response, res) : next(),
      )
      .catch(next);
  });

  /**
   * Basic error handler
   */
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

/**
 * Request handler used by Angular CLI / integrations.
 */
export const reqHandler = createNodeRequestHandler(app());

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}