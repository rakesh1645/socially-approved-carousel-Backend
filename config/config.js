const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const backendPath = path.resolve(__dirname, '..');
const lowerCaseEnvPath = path.join(backendPath, '.env');
const upperCaseEnvPath = path.join(backendPath, '.ENV');
dotenv.config({
  path: fs.existsSync(lowerCaseEnvPath) ? lowerCaseEnvPath : upperCaseEnvPath,
});

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, '');
const configuredOrigins = (
  process.env.CLIENT_ORIGINS
  || process.env.CLIENT_ORIGIN
  || process.env.BASE_URL
  || 'http://localhost:5173'
)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

module.exports = Object.freeze({
  port: Number(process.env.PORT) || 5000,
  clientOrigins: [...new Set(configuredOrigins)],
  apiPrefix: process.env.API_PREFIX || '/api',
  jsonLimit: process.env.JSON_LIMIT || '16kb',
  staticCache: process.env.STATIC_CACHE || '1d',
  publicPath: path.join(backendPath, 'public'),
});
