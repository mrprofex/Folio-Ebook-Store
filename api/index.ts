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
