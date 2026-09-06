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

async function uploadToCloudinaryUnsigned(
  buffer: Buffer,
  options: {
    folder: string;
    resource_type: string;
    upload_preset: string;
    public_id: string;
  }
): Promise<any> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  const boundary = `----FormBoundary${Math.random().toString(36).substring(2, 20)}`;
  const uploadPath = `/${options.resource_type}/upload`;
  const apiUrl = new URL(`https://api.cloudinary.com/v1_1/${cloudName}${uploadPath}`);

  const params = new URLSearchParams();
  params.append('folder', options.folder);
  params.append('resource_type', options.resource_type);
  params.append('upload_preset', options.upload_preset);
  params.append('unsigned', 'true');
  params.append('public_id', options.public_id);
  params.append('use_filename', 'true');
  params.append('unique_filename', 'true');
  params.append('timestamp', String(Math.floor(Date.now() / 1000)));

  const parts: Buffer[] = [];
  for (const [key, value] of params.entries()) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
        'utf8'
      )
    );
  }

  const fileHeader = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    'binary'
  );
  parts.push(fileHeader);
  parts.push(buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: apiUrl.hostname,
        path: apiUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        }
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString();
          try {
            const result = JSON.parse(responseBody);
            if (res.statusCode !== 200 || result.error) {
              const error: any = new Error(result.error?.message || `HTTP ${res.statusCode}`);
              error.http_code = res.statusCode;
              error.response = { data: result };
              return reject(error);
            }
            resolve(result);
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${responseBody}`));
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });
    req.write(body);
    req.end();
  });
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
        const publicId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        return await uploadToCloudinaryUnsigned(req.file.buffer, {
          folder,
          resource_type: resourceType,
          upload_preset: UPLOAD_PRESET,
          public_id: publicId
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
