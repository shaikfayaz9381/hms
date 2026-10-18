import { app } from './server/app.js';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
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
    const distDir = path.resolve(__dirname, 'dist');
    const indexHtml = path.join(distDir, 'index.html');

    // Self-heal: some hosts (e.g. misconfigured Render services) only run `npm install`
    // without a build step. If the frontend build is missing, create it once at startup
    // so the website still works without any dashboard configuration.
    if (!existsSync(indexHtml)) {
      console.log('[MedPulse] Frontend build (dist/) not found — building the client once...');
      try {
        execSync('npx vite build', { cwd: __dirname, stdio: 'inherit' });
        console.log('[MedPulse] Frontend build complete.');
      } catch (err) {
        console.error('[MedPulse] Frontend build failed:', err);
      }
    }

    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(indexHtml);
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
