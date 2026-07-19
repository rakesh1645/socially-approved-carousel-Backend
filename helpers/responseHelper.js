function successResponse(res, { data = null, pagination, message, code = 200 } = {}) {
  const response = { success: true };
  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(code).json(response);
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function notFoundHandler(req, res, next) {
  next(createHttpError(404, 'Route not found'));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error' : error.message,
  });
}

module.exports = { createHttpError, errorHandler, notFoundHandler, successResponse };
