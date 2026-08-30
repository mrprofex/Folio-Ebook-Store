import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = createApp();

  // Vite middleware for development; in production the built SPA is served from `dist`.
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Ebook Store Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
