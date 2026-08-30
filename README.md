<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Ebook Store

A full-stack ebook store with Neon PostgreSQL database, Razorpay payments, and Cloudinary storage.

## Run Locally

**Prerequisites:** Node.js, Neon PostgreSQL database

1. Install dependencies:
   `npm install`
2. Configure environment variables in `.env` (see `.env.example` for all required variables)
3. Initialize the database:
   `npx tsx server/db-migrate.ts`
4. Run the app:
   `npm run dev`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Neon PostgreSQL direct connection string (for migrations) |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `AUTH_SECRET` | JWT signing secret |
| `JWT_SECRET` | JWT fallback secret |
| `ADMIN_EMAIL` | Admin user email |
| `ADMIN_PASSWORD` | Admin user password |
| `APP_URL` | Application URL |
| `GEMINI_API_KEY` | Google Gemini API key |

## Default Admin Credentials

- Email: `admin@notemart.store`
- Password: `AdminSecurePassword123!`
