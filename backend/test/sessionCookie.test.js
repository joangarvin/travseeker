const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  getSessionCookie,
  setSessionCookie,
} = require('../src/utils/sessionCookie');

function responseStub() {
  const headers = new Map();
  return {
    setHeader(name, value) {
      headers.set(name.toLowerCase(), value);
    },
    get(name) {
      return headers.get(name.toLowerCase());
    },
  };
}

test('emite una cookie de sesión HttpOnly y la puede leer', () => {
  const response = responseStub();
  setSessionCookie(response, 'token con espacios');
  const header = response.get('set-cookie');
  assert.match(header, new RegExp(`${SESSION_COOKIE_NAME}=token%20con%20espacios`));
  assert.match(header, /HttpOnly/);
  assert.match(header, /SameSite=Lax/);

  const request = { headers: { cookie: header } };
  assert.equal(getSessionCookie(request), 'token con espacios');
});

test('limpia la cookie con Max-Age cero', () => {
  const response = responseStub();
  clearSessionCookie(response);
  assert.match(response.get('set-cookie'), new RegExp(`${SESSION_COOKIE_NAME}=;`));
  assert.match(response.get('set-cookie'), /Max-Age=0/);
});
