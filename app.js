const express = require('express');
const cors = require('cors');
const path = require('path');
const env = require('./config/config');
const videoRoutes = require('./routes/videoRoutes');
const { errorHandler, notFoundHandler } = require('./helpers/responseHelper');

const app = express();

app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    const error = new Error(`CORS blocked origin: ${origin}`);
    error.status = 403;
    return callback(error);
  },
}));
app.use(express.json({ limit: env.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: env.jsonLimit }));

app.use('/videos', express.static(path.join(env.publicPath, 'videos'), {
  acceptRanges: true,
  maxAge: env.staticCache,
}));
app.use('/images', express.static(path.join(env.publicPath, 'images'), {
  maxAge: env.staticCache,
}));
app.use('/thumbnails', express.static(path.join(env.publicPath, 'thumbnails'), {
  maxAge: env.staticCache,
}));

app.get('/', (req, res) => res.json({ success: true, message: 'Video API is running' }));
app.use(env.apiPrefix, videoRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`Video API running on http://localhost:${env.port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Stop the other backend process and retry.`);
    process.exitCode = 1;
    return;
  }
  throw error;
});

module.exports = server;
