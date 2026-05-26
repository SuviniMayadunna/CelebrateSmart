import nodemailer from 'nodemailer';
import { consumeNotifications, NotificationMessage } from '../lib/rabbitmq';

// Build a transporter from env vars; falls back to Ethereal (fake SMTP) for dev
async function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Ethereal: messages are caught and viewable at https://ethereal.email
  const testAccount = await nodemailer.createTestAccount();
  console.log('[worker] Ethereal SMTP — preview at https://ethereal.email');
  console.log('[worker] user:', testAccount.user, '| pass:', testAccount.pass);
  return nodemailer.createTransport({
    host:   'smtp.ethereal.email',
    port:   587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

async function sendEmails(transporter: nodemailer.Transporter, msg: NotificationMessage) {
  const from = process.env.EMAIL_FROM || '"CelebrateSmart" <no-reply@celebratesmart.com>';

  const sends = msg.emails.map(to =>
    transporter.sendMail({
      from,
      to,
      subject: msg.title,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#3b1a6b;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:22px">CelebrateSmart</h1>
          </div>
          <div style="padding:24px;background:#f9f7ff">
            <h2 style="color:#3b1a6b">${msg.title}</h2>
            <p style="color:#444;line-height:1.6">${msg.content}</p>
          </div>
          <div style="padding:16px;text-align:center;background:#f0ebff">
            <p style="color:#888;font-size:12px;margin:0">
              © ${new Date().getFullYear()} CelebrateSmart. Making celebrations unforgettable.
            </p>
          </div>
        </div>
      `,
    }).then(info => {
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) console.log('[worker] preview:', preview);
      console.log('[worker] sent to', to);
    }).catch(err => {
      console.error('[worker] send failed to', to, err.message);
    })
  );

  await Promise.allSettled(sends);
}

export async function startNotificationWorker(): Promise<void> {
  if (!process.env.RABBITMQ_URL && process.env.NODE_ENV === 'production') {
    console.warn('[worker] RABBITMQ_URL not set — notification worker disabled');
    return;
  }

  try {
    const transporter = await createTransporter();

    await consumeNotifications(async (msg: NotificationMessage) => {
      console.log('[worker] processing notification:', msg.title, '→', msg.emails.length, 'recipients');
      await sendEmails(transporter, msg);
    });
  } catch (err) {
    console.warn('[worker] could not connect to RabbitMQ — notification worker disabled:', (err as Error).message);
  }
}
