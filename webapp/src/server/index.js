import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupWsHandler } from './wsHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createServer() {
  const app = express();
  const server = http.createServer(app);

  // Serve static files in production
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  // WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  setupWsHandler(wss);

  return { app, server, wss };
}
