import { createApp } from '../server/app.js';

// Vercel serverless function entry.
// NODE_ENV is "production" on Vercel, so createApp() serves the built SPA from `dist`
// and mounts all /api routes. The function is bundled by Vercel's @vercel/node builder.
const app = createApp();

export default app;
