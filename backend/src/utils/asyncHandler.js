// Wraps an async route handler so thrown errors are forwarded to the
// central error middleware instead of repeating try/catch in every controller.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { asyncHandler };
