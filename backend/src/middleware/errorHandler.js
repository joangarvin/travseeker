// Central error handler. Honors `err.status` and `err.message` set by services
// (e.g. `error.status = 404`), falling back to a generic 500 for unexpected errors.
function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor' : err.message || 'Error en la solicitud',
  });
}

module.exports = { errorHandler };
