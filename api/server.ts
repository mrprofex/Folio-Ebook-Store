import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from '../server/routes/auth.js';
import ebooksRoutes from '../server/routes/ebooks.js';
import paymentsRoutes from '../server/routes/payments.js';
import downloadRoutes from '../server/routes/download.js';
import userRoutes from '../server/routes/user.js';
import adminRoutes from '../server/routes/admin.js';
import uploadRoutes from '../server/routes/upload.js';
import { db } from '../server/db.js';

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const uploadsDir = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Ebook Store API',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (process.env.APP_URL || 'https://folio-ebook.vercel.app').replace(/\/$/, '');
    const now = new Date().toISOString();

    const urls: string[] = [];

    const addUrl = (loc: string, lastmod?: string, changefreq = 'weekly', priority = '0.8') => {
      const escapedLoc = loc.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
      const escapedLastmod = lastmod ? lastmod.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>') : now;
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

// Also handle /sitemap.xml (for Vercel rewrites that strip /api prefix)
app.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (process.env.APP_URL || 'https://folio-ebook.vercel.app').replace(/\/$/, '');
    const now = new Date().toISOString();

    const urls: string[] = [];

    const addUrl = (loc: string, lastmod?: string, changefreq = 'weekly', priority = '0.8') => {
      const escapedLoc = loc.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
      const escapedLastmod = lastmod ? lastmod.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>') : now;
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
app.use('/api/ebooks', downloadRoutes);
app.use('/api/ebooks', ebooksRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'API route not found' });
});

const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
