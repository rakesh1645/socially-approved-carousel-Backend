const app = require('./src/app');

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`Video API running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other backend process and retry.`);
    process.exitCode = 1;
    return;
  }
  throw error;
});

module.exports = server;
