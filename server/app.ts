import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import ebooksRoutes from './routes/ebooks';
import paymentsRoutes from './routes/payments';
import downloadRoutes from './routes/download';
import userRoutes from './routes/user';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import { db } from './db.js';

// Builds the Express app WITHOUT starting a server.
// In production (Vercel serverless / `npm run start`) it serves the built SPA from `dist`.
// In development (`npm run dev`) Vite middleware is attached in server.ts.
export function createApp() {
  const app = express();

  // Trust Vercel proxy for secure cookies / correct hostnames
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // CORS configuration
  const corsOrigins = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || process.env.APP_URL || '*';
  const allowedOrigins = corsOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Vary', 'Origin');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Request timeout middleware
  app.use((req, res, next) => {
    const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);
    req.setTimeout(timeout);
    res.setTimeout(timeout);
    next();
  });

  const uploadsDir = path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Ebook Store API',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/sitemap-test', (req, res) => {
    res.send('TEST');
  });

  // Dynamic sitemap.xml
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = (process.env.APP_URL || 'https://folio-ebook.vercel.app').replace(/\/$/, '');
      const now = new Date().toISOString();

      const urls: string[] = [];

      const addUrl = (loc: string, lastmod?: string, changefreq = 'weekly', priority = '0.8') => {
        const escapedLoc = loc.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const escapedLastmod = lastmod ? lastmod.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : now;
        urls.push(
          `<url>` +
            `<loc>${escapedLoc}</loc>` +
            `<lastmod>${escapedLastmod}</lastmod>` +
            `<changefreq>${changefreq}</changefreq>` +
            `<priority>${priority}</priority>` +
          `</url>`
        );
      };

      addUrl(`${baseUrl}/`, now, 'daily', '1.0');
      addUrl(`${baseUrl}/ebooks`, now, 'daily', '0.9');
      addUrl(`${baseUrl}/about`, now, 'monthly', '0.6');
      addUrl(`${baseUrl}/terms`, now, 'monthly', '0.5');
      addUrl(`${baseUrl}/privacy-policy`, now, 'monthly', '0.5');
      addUrl(`${baseUrl}/refunds`, now, 'monthly', '0.5');
      addUrl(`${baseUrl}/contact`, now, 'monthly', '0.5');
      addUrl(`${baseUrl}/delivery`, now, 'monthly', '0.5');

      const ebooks = await db.getAllEbooks({ publishedOnly: true });
      for (const ebook of ebooks) {
        if (ebook.slug && ebook.published) {
          addUrl(`${baseUrl}/ebooks/${ebook.slug}`, ebook.updatedAt || ebook.createdAt, 'weekly', '0.8');
        }
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls.join('\n') +
        `\n</urlset>`;

       res.setHeader('Content-Type', 'application/xml');
       res.send(xml);
    } catch (err) {
      console.error('Sitemap generation error:', err);
      res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/ebooks', downloadRoutes); // handles /:id/download and /:id/pdf-content
  app.use('/api/ebooks', ebooksRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found' });
  });

  const distPath = path.join(process.cwd(), 'dist');
  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
