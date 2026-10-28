import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './src/server/api.ts';
import { getDb } from './src/server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Ensure database is initialized with seeds
  getDb();

  // Middleware
  app.use(express.json());

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'medrella-doctor-scheduler',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  if (!isProduction) {
    // Mount Vite middlewares in development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Serve static assets in production
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Medrella] Server running at http://0.0.0.0:${PORT}`);
    console.log(`[Medrella] REST API mounted at http://0.0.0.0:${PORT}/api`);
  });
}

startServer().catch((err) => {
  console.error('[Medrella] Server startup failure:', err);
  process.exit(1);
});
