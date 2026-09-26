import nodemailer from 'nodemailer';

export function createMailerTransport() {
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

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
