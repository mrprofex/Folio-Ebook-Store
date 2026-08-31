// Use the TypeScript source module path so Vercel's function bundler includes it.
// Referencing app.js fails in the deployed function because this repository only
// contains server/app.ts.
import { createApp } from '../server/app';

// Vercel serverless function entry.
// NODE_ENV is "production" on Vercel, so createApp() serves the built SPA from `dist`
// and mounts all /api routes. The function is bundled by Vercel's @vercel/node builder.
const app = createApp();

export default app;
