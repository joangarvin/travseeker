const test = require("node:test");
const assert = require("node:assert/strict");
const { env } = require("../src/config/env");
const { csrfProtection } = require("../src/middleware/security");
test("cookie mutations accept only explicitly configured frontend origins", () => {
  const previous = env.frontendOrigins;
  env.frontendOrigins = ["http://localhost:5177", "http://127.0.0.1:5176"];
  try {
    for (const origin of [
      ...env.frontendOrigins,
      "https://unexpected.example",
      "http://localhost:5178",
    ]) {
      let allowed = false,
        status;
      csrfProtection(
        { method: "POST", headers: { origin } },
        {
          status(value) {
            status = value;
            return this;
          },
          json() {},
        },
        () => {
          allowed = true;
        },
      );
      assert.equal(allowed, env.frontendOrigins.includes(origin));
      if (!allowed) assert.equal(status, 403);
    }
  } finally {
    env.frontendOrigins = previous;
  }
});
