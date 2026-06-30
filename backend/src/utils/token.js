const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateToken };
