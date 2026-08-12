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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function emailLayout({ title, message, ctaLabel, ctaUrl }) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeCtaUrl = escapeHtml(ctaUrl);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light only">
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f5fa;color:#111217;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${safeMessage}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f5fa;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:0 0 18px;font-size:20px;font-weight:900;letter-spacing:-1px;color:#111217;">
                <span style="display:inline-block;width:28px;height:28px;line-height:28px;margin-right:8px;border-radius:50% 50% 50% 6px;background:#111217;color:#f3f5fa;text-align:center;font-size:12px;vertical-align:middle;">T</span>
                TravSeeker
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #c6cad4;background:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="height:10px;background:#3047f2;font-size:0;line-height:0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding:42px 40px 18px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="width:48px;height:48px;border-radius:50%;background:#ffd51f;color:#171200;text-align:center;font-size:23px;font-weight:900;">✓</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 40px;">
                      <p style="margin:0 0 14px;color:#3047f2;font-size:11px;font-weight:800;letter-spacing:2.2px;text-transform:uppercase;">CUENTA / UN ÚLTIMO PASO</p>
                      <h1 style="margin:0 0 20px;color:#111217;font-size:42px;line-height:0.98;letter-spacing:-2.2px;font-weight:900;">${safeTitle}</h1>
                      <p style="margin:0;color:#5f6470;font-size:16px;line-height:1.65;">${safeMessage}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px 40px 38px;">
                      <a href="${safeCtaUrl}" style="display:inline-block;padding:16px 24px;border-radius:999px;background:#3047f2;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;">${safeCtaLabel} →</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:22px 40px;border-top:1px solid #c6cad4;background:#f8f9fc;">
                      <p style="margin:0 0 8px;color:#5f6470;font-size:12px;line-height:1.5;">Si el botón no funciona, copia este enlace en el navegador:</p>
                      <p style="margin:0;color:#3047f2;font-size:11px;line-height:1.5;word-break:break-all;">${safeCtaUrl}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 2px;color:#747987;font-size:11px;line-height:1.5;">
                TravSeeker · El lugar correcto empieza con una buena decisión.<br>
                Si no solicitaste este correo, puedes ignorarlo.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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

module.exports = { emailLayout, sendMail };
