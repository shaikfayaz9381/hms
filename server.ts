import { app } from './server/app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    // Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Serve static build in production
    const express = (await import('express')).default;
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MedPulse Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[MedPulse Server] REST API available at http://0.0.0.0:${PORT}/api/`);
    console.log(`[MedPulse Server] Health check at http://0.0.0.0:${PORT}/api/health`);
  });
}

startServer().catch(err => {
  console.error('[MedPulse Server] Failed to start:', err);
  process.exit(1);
});
