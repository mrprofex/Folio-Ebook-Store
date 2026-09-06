import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import http from 'http';
import https from 'https';
import { authMiddleware, adminMiddleware } from '../auth.js';

const router = Router();

// Use memory storage for Vercel serverless compatibility (read-only filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Initialize Cloudinary if configured
// Unsigned uploads require only cloud_name; signed uploads additionally require api_key and api_secret.
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('sample')
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const CLOUDINARY_SDK_VERSION = '2.11.0';
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'folio_uploads';

function safeStringify(obj: any, maxLength = 1000): string {
  try {
    const str = JSON.stringify(obj);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  } catch (e) {
    return '[Could not serialize object]';
  }
}

function extractCloudinaryError(cloudErr: any): { message: string; code: string; httpCode: string; details?: string } {
  const httpCode = String(cloudErr.http_code || cloudErr.code || 'UNKNOWN');
  let message = cloudErr.message || 'Cloudinary upload failed';
  let details: string | undefined;

  const responseData = cloudErr.response?.data;
  if (responseData) {
    const cloudinaryMessage = responseData?.error?.message;
    if (cloudinaryMessage) {
      message = cloudinaryMessage;
    }
    details = safeStringify(responseData, 500);
  }

  const xCldError = cloudErr.response?.headers?.['x-cld-error'];
  if (xCldError) {
    details = details ? `${details} | X-Cld-Error: ${xCldError}` : `X-Cld-Error: ${xCldError}`;
  }

  return { message, code: httpCode, httpCode, details };
}

async function withCloudinary403Capture<T>(uploadFn: () => Promise<T>): Promise<T> {
  const originalHttpRequest = http.request;
  const originalHttpsRequest = https.request;
  let captured403Body: string | undefined;

  http.request = function(requestOptions, callback) {
    const req = originalHttpRequest.call(this, requestOptions, function(res) {
      if (res.statusCode === 403) {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          captured403Body = Buffer.concat(chunks).toString();
          console.log('[UPLOAD] Captured 403 response body (http):', captured403Body);
        });
      }
      callback(res);
    });
    return req;
  };

  https.request = function(requestOptions, callback) {
    const req = originalHttpsRequest.call(this, requestOptions, function(res) {
      if (res.statusCode === 403) {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          captured403Body = Buffer.concat(chunks).toString();
          console.log('[UPLOAD] Captured 403 response body (https):', captured403Body);
        });
      }
      callback(res);
    });
    return req;
  };

  try {
    return await uploadFn();
  } finally {
    http.request = originalHttpRequest;
    https.request = originalHttpsRequest;
    if (captured403Body) {
      console.log('[UPLOAD] Final captured 403 body:', captured403Body);
    }
  }
}

// Upload endpoint (Admin only)
router.post('/file', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('[UPLOAD] Cloudinary configured:', isCloudinaryConfigured);
    console.log('[UPLOAD] CLOUDINARY_CLOUD_NAME exists:', Boolean(process.env.CLOUDINARY_CLOUD_NAME));
    console.log('[UPLOAD] CLOUDINARY_API_KEY exists:', Boolean(process.env.CLOUDINARY_API_KEY));
    console.log('[UPLOAD] CLOUDINARY_API_SECRET exists:', Boolean(process.env.CLOUDINARY_API_SECRET));
    console.log('[UPLOAD] Cloudinary SDK:', CLOUDINARY_SDK_VERSION);
    console.log('[UPLOAD] Upload preset:', UPLOAD_PRESET);

    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'No file was uploaded' });
    }

    console.log('[UPLOAD] File received:', req.file.originalname, req.file.mimetype, req.file.size);

    // Validate file type
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    const isImage = req.file.mimetype.startsWith('image/');

    if (!isPdf && !isImage) {
      console.log('[UPLOAD] Invalid file type:', req.file.mimetype);
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Only PDF documents and images are allowed.'
      });
    }

    const resourceType = isImage ? 'image' : 'raw';
    const folder = isImage ? 'ebooks/covers' : 'ebooks';
    console.log('[UPLOAD] Is image:', isImage, 'Is PDF:', isPdf, 'Resource type:', resourceType, 'Folder:', folder);

    if (!isCloudinaryConfigured) {
      console.log('[UPLOAD] Cloudinary not configured');
      return res.status(500).json({
        error: 'CLOUDINARY_NOT_CONFIGURED',
        message: 'Cloudinary is required for file uploads on Vercel. Please configure CLOUDINARY_CLOUD_NAME.'
      });
    }

    try {
      console.log('[UPLOAD] Uploading to Cloudinary - folder:', folder, 'resource_type:', resourceType, 'upload_preset:', UPLOAD_PRESET);

      const uploadResult = await withCloudinary403Capture(async () => {
        const stream = Readable.from(req.file.buffer);
        const publicId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        return await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: resourceType,
              upload_preset: UPLOAD_PRESET,
              unsigned: true,
              public_id: publicId,
              use_filename: true,
              unique_filename: true
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          stream.pipe(uploadStream);
        });
      });

      console.log('[UPLOAD] Cloudinary upload success:', uploadResult.public_id);
      return res.json({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        resourceType: uploadResult.resource_type,
        fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
        filename: req.file.originalname
      });
    } catch (cloudErr: any) {
      console.error('[UPLOAD] Cloudinary upload error keys:', Object.keys(cloudErr));
      console.error('[UPLOAD] Cloudinary upload error message:', cloudErr.message);
      console.error('[UPLOAD] Cloudinary HTTP status:', cloudErr.http_code || 'N/A');
      console.error('[UPLOAD] Cloudinary error code:', cloudErr.code || 'N/A');
      console.error('[UPLOAD] Cloudinary error name:', cloudErr.name || 'N/A');

      if (cloudErr.response) {
        console.error('[UPLOAD] Cloudinary response headers:', safeStringify(cloudErr.response.headers, 500));
        console.error('[UPLOAD] Cloudinary response data:', safeStringify(cloudErr.response.data, 1000));
      }

      if (cloudErr.request) {
        console.error('[UPLOAD] Cloudinary request method:', cloudErr.request.method);
        console.error('[UPLOAD] Cloudinary request path:', cloudErr.request.path);
      }

      console.error('[UPLOAD] Upload params - resource_type:', resourceType, 'folder:', folder, 'upload_preset:', UPLOAD_PRESET);
      console.error('[UPLOAD] File mimetype:', req.file.mimetype, 'size:', req.file.size);

      const extracted = extractCloudinaryError(cloudErr);

      return res.status(500).json({
        error: 'CLOUDINARY_UPLOAD_FAILED',
        message: `Cloudinary upload failed (Error ${extracted.httpCode}): ${extracted.message}`,
        details: extracted.details
      });
    }
  } catch (err: any) {
    console.error('[UPLOAD] File upload error:', err.message);
    return res.status(500).json({ error: 'UPLOAD_FAILED', message: err.message || 'File upload failed' });
  }
});

// Protected diagnostic endpoint (Admin only)
router.get('/diagnostic', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const diagnostics: any = {
      cloudinaryConfigured: isCloudinaryConfigured,
      cloudName: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      apiKey: Boolean(process.env.CLOUDINARY_API_KEY),
      apiSecret: Boolean(process.env.CLOUDINARY_API_SECRET),
      uploadPreset: UPLOAD_PRESET,
      sdkVersion: CLOUDINARY_SDK_VERSION,
      timestamp: new Date().toISOString()
    };

    if (!isCloudinaryConfigured) {
      return res.json(diagnostics);
    }

    try {
      const usage = await cloudinary.api.usage();
      diagnostics.apiUsage = {
        plan: usage.plan || 'unknown',
        uploads: usage.uploads || 0,
        storage: usage.storage || 0,
        bandwidth: usage.bandwidth || 0
      };
      diagnostics.authTest = 'SUCCESS';
    } catch (authErr: any) {
      diagnostics.authTest = 'FAILED';
      diagnostics.authError = {
        message: authErr.message,
        http_code: authErr.http_code || 'N/A',
        code: authErr.code || 'N/A'
      };
      if (authErr.response?.data) {
        diagnostics.authError.data = authErr.response.data;
      }
    }

    try {
      const resourceTypes = await cloudinary.api.resource_types();
      diagnostics.resourceTypes = resourceTypes;
    } catch (rtErr: any) {
      diagnostics.resourceTypesError = {
        message: rtErr.message,
        http_code: rtErr.http_code || 'N/A'
      };
    }

    res.json(diagnostics);
  } catch (err: any) {
    res.status(500).json({ error: 'DIAGNOSTIC_FAILED', message: err.message });
  }
});

export default router;
