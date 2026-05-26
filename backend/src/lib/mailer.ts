import nodemailer from 'nodemailer';

let _transport: nodemailer.Transporter | null = null;

async function getTransport(): Promise<nodemailer.Transporter> {
  if (_transport) return _transport;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    _transport = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return _transport;
  }

  // Dev fallback — Ethereal catches all mail; preview at https://ethereal.email
  const account = await nodemailer.createTestAccount();
  console.log('[mailer] Ethereal SMTP — preview at https://ethereal.email');
  console.log('[mailer] user:', account.user, '| pass:', account.pass);
  _transport = nodemailer.createTransport({
    host:   'smtp.ethereal.email',
    port:   587,
    secure: false,
    auth: { user: account.user, pass: account.pass },
  });
  return _transport;
}

const FROM = process.env.EMAIL_FROM ?? '"CelebrateSmart" <noreply@celebratesmart.com>';

export async function sendMail(options: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<void> {
  try {
    const transport = await getTransport();
    const info = await transport.sendMail({ from: FROM, ...options });
    // In dev with Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('[mailer] Preview:', previewUrl);
  } catch (err) {
    console.error('[mailer] Failed to send email:', err);
  }
}
