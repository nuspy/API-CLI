import { createServer } from './src/server/index.js';

const PORT = process.env.PORT || 3001;

const { app, server } = createServer();

server.listen(PORT, () => {
  console.log(`War Room server listening on http://localhost:${PORT}`);
});
