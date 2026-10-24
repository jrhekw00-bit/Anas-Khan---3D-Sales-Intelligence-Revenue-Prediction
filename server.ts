import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const FASTAPI_PORT = 8000;
const isProd = process.env.NODE_ENV === 'production';

let pythonProc: ChildProcess | null = null;

// Start FastAPI background server
function startPythonBackend() {
  const pythonCmd = 'python3';
  const args = [
    '-m',
    'uvicorn',
    'app.main:app',
    '--host',
    '127.0.0.1',
    '--port',
    String(FASTAPI_PORT),
    '--app-dir',
    path.join(__dirname, 'backend')
  ];

  console.log(`[FullStack] Spawning Python FastAPI backend on port ${FASTAPI_PORT}...`);
  pythonProc = spawn(pythonCmd, args, {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: path.join(__dirname, 'backend') }
  });

  pythonProc.on('error', (err) => {
    console.error('[FullStack] Failed to launch Python backend:', err.message);
  });

  pythonProc.on('exit', (code, signal) => {
    console.log(`[FullStack] Python backend exited with code ${code} / signal ${signal}`);
  });
}

async function startServer() {
  startPythonBackend();

  const app = express();

  // Proxy /api requests to FastAPI backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://127.0.0.1:${FASTAPI_PORT}`,
      changeOrigin: true,
      ws: true,
      on: {
        error: (err: any, _req: any, res: any) => {
          console.error('[Proxy Error] Could not connect to FastAPI backend:', err?.message);
          if (res && typeof res.writeHead === 'function' && !res.headersSent) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                error: 'Backend ML service is currently initializing or unavailable.',
                details: err?.message
              })
            );
          }
        }
      }
    })
  );

  if (!isProd) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built assets
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FullStack] Anas Khan Server running on http://0.0.0.0:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    if (pythonProc) {
      pythonProc.kill('SIGTERM');
    }
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('[FullStack] Error starting server:', err);
  process.exit(1);
});
