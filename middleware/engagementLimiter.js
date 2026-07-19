const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});
