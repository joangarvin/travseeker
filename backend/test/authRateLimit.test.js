const test = require('node:test');
const assert = require('node:assert/strict');
const { authRateLimit } = require('../src/middleware/security');

function invoke(method, path, ip) {
  const result = { allowed: false, headers: {} };
  const response = {
    setHeader(name, value) {
      result.headers[name] = value;
    },
    status(status) {
      result.status = status;
      return this;
    },
    json(body) {
      result.body = body;
    },
  };
  authRateLimit({ method, path, ip }, response, () => {
    result.allowed = true;
  });
  return result;
}

test('consultar la sesión repetidamente no bloquea el siguiente inicio de sesión', () => {
  for (let index = 0; index < 100; index++) {
    assert.equal(invoke('GET', '/me', 'session-reader').allowed, true);
  }
  assert.equal(invoke('POST', '/login', 'session-reader').allowed, true);
});

test('el límite de intentos de acceso sigue bloqueando el intento 81', () => {
  for (let index = 0; index < 80; index++) {
    assert.equal(invoke('POST', '/login', 'login-attempts').allowed, true);
  }
  const blocked = invoke('POST', '/login', 'login-attempts');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers['Retry-After'] > 0);
  assert.equal(invoke('GET', '/me', 'login-attempts').allowed, true);
});

test('los cambios de perfil y la recuperación de contraseña mantienen el límite', () => {
  for (let index = 0; index < 80; index++) {
    const path = index % 2 ? '/me' : '/password/forgot';
    assert.equal(
      invoke(index % 2 ? 'PATCH' : 'POST', path, 'account-writes').allowed,
      true,
    );
  }
  assert.equal(invoke('PATCH', '/me', 'account-writes').status, 429);
  assert.equal(
    invoke('POST', '/password/forgot', 'account-writes').status,
    429,
  );
});
