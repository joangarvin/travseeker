const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

function emailLayout({ title, message, ctaLabel, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;background:#f0faf5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;">
      <div style="background:#ffffff;border-radius:16px;padding:40px 32px;border:1px solid rgba(10,15,13,0.08);">
        <h1 style="font-size:22px;color:#0a0f0d;margin:0 0 12px;">${title}</h1>
        <p style="font-size:15px;color:#3d5248;line-height:1.6;margin:0 0 28px;">${message}</p>
        <a href="${ctaUrl}" style="display:inline-block;background:#2eb87a;color:#062a1c;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:15px;">${ctaLabel}</a>
        <p style="font-size:12px;color:#8aa898;margin:28px 0 0;word-break:break-all;">O copia este enlace: ${ctaUrl}</p>
      </div>
      <p style="text-align:center;font-size:12px;color:#8aa898;margin-top:24px;">TravSeeker · Viaja con intención</p>
    </div>
  </body>
</html>`;
}

async function sendMail({ to, subject, title, message, ctaLabel, ctaUrl }) {
  const html = emailLayout({ title, message, ctaLabel, ctaUrl });
  const text = `${title}\n\n${message}\n\n${ctaLabel}: ${ctaUrl}`;
  const t = getTransporter();

  if (!t) {
    console.log('\n=== EMAIL (modo desarrollo, sin SMTP configurado) ===');
    console.log(`Para:    ${to}`);
    console.log(`Asunto:  ${subject}`);
    console.log(`Enlace:  ${ctaUrl}`);
    console.log('====================================================\n');
    return { delivered: false };
  }

  await t.sendMail({
    from: process.env.MAIL_FROM || 'TravSeeker <no-reply@travseeker.com>',
    to,
    subject,
    text,
    html,
  });
  return { delivered: true };
}

module.exports = { sendMail };
