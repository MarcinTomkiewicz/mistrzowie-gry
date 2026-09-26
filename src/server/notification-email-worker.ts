import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';

import { createMailerTransport, getMailSenderIdentity } from './mail-transport';
import { buildNotificationEmail } from './notification-email';
import type { NotificationEmailClaim } from './notification-email-types';
import { getServiceRoleClient } from './supabase-service-role';

let started = false;

export function startNotificationEmailWorker(): void {
  if (started) return;
  started = true;

  const client = getServiceRoleClient();

  if (!client) {
    console.info(
      '[NOTIFICATION EMAIL WORKER] Disabled: SUPABASE_SERVICE_ROLE_KEY is missing.',
    );
    return;
  }

  let processing = false;

  const processBatch = async (): Promise<void> => {
    if (processing) return;
    processing = true;

    try {
      const { data, error }: PostgrestSingleResponse<NotificationEmailClaim[]> =
        await client.rpc('claim_notification_emails', { p_limit: 20 });

      if (error || data === null) {
        console.error('[NOTIFICATION EMAIL WORKER] Failed to claim batch.');
        return;
      }

      for (const notification of data) {
        await processNotification(client, notification);
      }
    } catch {
      console.error('[NOTIFICATION EMAIL WORKER] Batch failed.');
    } finally {
      processing = false;
    }
  };

  void processBatch();
  setInterval(() => void processBatch(), 60_000).unref();
}

async function processNotification(
  client: SupabaseClient,
  notification: NotificationEmailClaim,
): Promise<void> {
  let success = false;
  let safeError: string | null = null;

  try {
    const email = buildNotificationEmail(notification);
    const transport = createMailerTransport();

    await transport.sendMail({
      ...email,
      from: getMailSenderIdentity(),
      to: notification.recipient_email,
    });
    success = true;
  } catch (error) {
    safeError = safeSmtpError(error);
  }

  try {
    const { error } = await client.rpc('complete_notification_email', {
      p_notification_id: notification.notification_id,
      p_success: success,
      p_error: safeError,
    });

    if (error) throw error;
  } catch {
    console.error(
      '[NOTIFICATION EMAIL WORKER] Failed to complete notification:',
      notification.notification_id,
    );
  }
}

function safeSmtpError(error: unknown): string {
  const codes = [
    'EAUTH', 'ENOAUTH', 'ECONNECTION', 'ETIMEDOUT', 'ESOCKET', 'EDNS',
    'ETLS', 'EREQUIRETLS', 'EPROTOCOL', 'EENVELOPE', 'EMESSAGE', 'ESTREAM',
  ];

  if (
    error !== null && typeof error === 'object' && 'code' in error &&
    typeof error.code === 'string' && codes.includes(error.code)
  ) {
    return `SMTP send failed (${error.code})`;
  }

  return 'SMTP send failed';
}
