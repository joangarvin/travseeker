const test = require('node:test');
const assert = require('node:assert/strict');
const { emailLayout } = require('../src/utils/mailer');

test('genera un email de marca con alternativa accesible y datos escapados', () => {
  const html = emailLayout({
    title: 'Confirma <TravSeeker>',
    message: 'Activa tu cuenta & empieza a viajar.',
    ctaLabel: 'Confirmar "ahora"',
    ctaUrl: 'https://travseeker.test/verificar-email?token=a&source=email',
  });

  assert.match(html, /#3047f2/);
  assert.match(html, /TravSeeker/);
  assert.match(html, /Confirma &lt;TravSeeker&gt;/);
  assert.match(html, /Activa tu cuenta &amp; empieza a viajar\./);
  assert.match(html, /token=a&amp;source=email/);
  assert.doesNotMatch(html, /<script/i);
});
