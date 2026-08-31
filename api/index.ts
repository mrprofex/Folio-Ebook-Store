// Import from TypeScript source - Vercel will bundle it
import { createApp } from '../server/app';

// Vercel serverless function entry.
// NODE_ENV is "production" on Vercel, so createApp() serves the built SPA from `dist`
// and mounts all /api routes.
const app = createApp();

export default app;
