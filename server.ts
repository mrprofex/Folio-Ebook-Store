import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import authRoutes from './server/routes/auth';
import ebooksRoutes from './server/routes/ebooks';
import paymentsRoutes from './server/routes/payments';
import downloadRoutes from './server/routes/download';
import userRoutes from './server/routes/user';
import adminRoutes from './server/routes/admin';
import uploadRoutes from './server/routes/upload';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON & URL-encoded parsing middleware
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static uploads directory serving
  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Ebook Store API',
      timestamp: new Date().toISOString()
    });
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/ebooks', downloadRoutes); // handles /:id/download and /:id/pdf-content
  app.use('/api/ebooks', ebooksRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);

  // Global API 404 handler
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found' });
  });

  // Vite middleware for development & SPA fallback for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Ebook Store Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
