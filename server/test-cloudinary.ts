/**
 * Local Cloudinary diagnostic utility.
 *
 * Usage:
 *   npx tsx server/test-cloudinary.ts
 *
 * This script reads environment variables from .env and performs
 * safe, read-only Cloudinary diagnostics. It does NOT print secrets.
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('[CLOUDINARY TEST] CLOUDINARY_CLOUD_NAME present:', Boolean(cloudName));
console.log('[CLOUDINARY TEST] CLOUDINARY_API_KEY present:', Boolean(apiKey));
console.log('[CLOUDINARY TEST] CLOUDINARY_API_SECRET present:', Boolean(apiSecret));

if (!cloudName || !apiKey || !apiSecret) {
  console.error('[CLOUDINARY TEST] Missing required environment variables. Aborting.');
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

async function runDiagnostics() {
  console.log('\n--- Cloudinary Auth Test ---');
  try {
    const usage = await cloudinary.api.usage();
    console.log('[CLOUDINARY TEST] Auth: SUCCESS');
    console.log('[CLOUDINARY TEST] Plan:', usage.plan || 'unknown');
    console.log('[CLOUDINARY TEST] Uploads:', usage.uploads || 0);
    console.log('[CLOUDINARY TEST] Storage:', usage.storage || 0);
    console.log('[CLOUDINARY TEST] Bandwidth:', usage.bandwidth || 0);
  } catch (err: any) {
    console.error('[CLOUDINARY TEST] Auth: FAILED');
    console.error('[CLOUDINARY TEST] Error message:', err.message);
    console.error('[CLOUDINARY TEST] HTTP status:', err.http_code || 'N/A');
    console.error('[CLOUDINARY TEST] Error code:', err.code || 'N/A');
    if (err.response?.data) {
      console.error('[CLOUDINARY TEST] Response data:', JSON.stringify(err.response.data, null, 2));
    }
    if (err.response?.headers?.['x-cld-error']) {
      console.error('[CLOUDINARY TEST] X-Cld-Error:', err.response.headers['x-cld-error']);
    }
  }

  console.log('\n--- Cloudinary Upload Test (raw) ---');
  try {
    const testBuffer = Buffer.from('%PDF-1.4 test');
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'ebooks/pdfs',
        public_id: `diagnostic-test-${Date.now()}`
      },
      (error, result) => {
        if (error) {
          console.error('[CLOUDINARY TEST] Upload error message:', error.message);
          console.error('[CLOUDINARY TEST] Upload HTTP status:', error.http_code || 'N/A');
          console.error('[CLOUDINARY TEST] Upload error code:', error.code || 'N/A');
          if (error.response?.data) {
            console.error('[CLOUDINARY TEST] Upload response data:', JSON.stringify(error.response.data, null, 2));
          }
          if (error.response?.headers?.['x-cld-error']) {
            console.error('[CLOUDINARY TEST] Upload X-Cld-Error:', error.response.headers['x-cld-error']);
          }
          process.exit(1);
        } else {
          console.log('[CLOUDINARY TEST] Upload: SUCCESS');
          console.log('[CLOUDINARY TEST] secure_url:', result.secure_url);
          console.log('[CLOUDINARY TEST] public_id:', result.public_id);
          console.log('[CLOUDINARY TEST] resource_type:', result.resource_type);
          console.log('[CLOUDINARY TEST] bytes:', result.bytes);
          process.exit(0);
        }
      }
    );
    stream.end(testBuffer);
  } catch (err: any) {
    console.error('[CLOUDINARY TEST] Upload setup error:', err.message);
    process.exit(1);
  }
}

runDiagnostics();
