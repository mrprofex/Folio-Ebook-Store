import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import http from 'http';
import https from 'https';
import { authMiddleware, adminMiddleware } from '../auth.js';
import {
  isSupabaseConfigured,
  uploadPdfToSupabase,
  deletePdfFromSupabase,
  supabase
} from '../supabase.js';

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
    resource_type: 'image' | 'raw' | 'video' | 'auto';
    upload_preset: string;
    public_id: string;
    filename?: string;
  }
): Promise<any> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resource_type,
        upload_preset: options.upload_preset,
        unsigned: true,
        public_id: options.public_id,
        filename_override: options.filename || undefined,
        timestamp: Math.floor(Date.now() / 1000)
      },
      (error, result) => {
        if (error) {
          const err: any = new Error(error.message || 'Cloudinary upload failed');
          err.http_code = error.http_code;
          err.response = error.response;
          return reject(err);
        }
        resolve(result);
      }
    );

    const readable = new Readable({ read() {} });
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      reject(err);
    });
  });
}

// Upload endpoint (Admin only)
router.post('/file', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'No file was uploaded' });
    }

    // Validate file type
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    const isImage = req.file.mimetype.startsWith('image/');

    if (!isPdf && !isImage) {
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Only PDF documents and images are allowed.'
      });
    }

    // Handle PDF uploads via Supabase
    if (isPdf) {
      if (!isSupabaseConfigured) {
        return res.status(500).json({
          error: 'SUPABASE_NOT_CONFIGURED',
          message: 'Supabase is required for PDF uploads. Please configure SUPABASE_URL and SUPABASE_SECRET_KEY.'
        });
      }

      try {
        const { path: storagePath, size } = await uploadPdfToSupabase(req.file.buffer, req.file.originalname);
        return res.json({
          url: storagePath,
          publicId: storagePath,
          resourceType: 'supabase',
          fileSize: `${(size / (1024 * 1024)).toFixed(2)} MB`,
          filename: req.file.originalname
        });
      } catch (supabaseErr: any) {
        console.error('[UPLOAD] Supabase upload error:', supabaseErr.message);
        return res.status(500).json({
          error: 'SUPABASE_UPLOAD_FAILED',
          message: `Supabase upload failed: ${supabaseErr.message}`
        });
      }
    }

    // Handle image uploads via Cloudinary
    if (!isCloudinaryConfigured) {
      console.log('[UPLOAD] Cloudinary not configured for image upload');
      return res.status(500).json({
        error: 'CLOUDINARY_NOT_CONFIGURED',
        message: 'Cloudinary is required for image uploads. Please configure CLOUDINARY_CLOUD_NAME.'
      });
    }

    const resourceType = 'image';
    const folder = 'ebooks/covers';
    console.log('[UPLOAD] Uploading image to Cloudinary - folder:', folder, 'resource_type:', resourceType);

    try {
      const uploadResult = await withCloudinary403Capture(async () => {
        const publicId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        return await uploadToCloudinaryUnsigned(req.file.buffer, {
          folder,
          resource_type: resourceType,
          upload_preset: UPLOAD_PRESET,
          public_id: publicId,
          filename: req.file.originalname
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
      supabaseConfigured: isSupabaseConfigured,
      supabaseUrl: Boolean(process.env.SUPABASE_URL),
      supabaseSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
      timestamp: new Date().toISOString()
    };

    if (isCloudinaryConfigured) {
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
    }

    if (isSupabaseConfigured) {
      try {
        const { data: buckets } = await supabase!.storage.listBuckets();
        diagnostics.supabaseBuckets = buckets?.map(b => b.name) || [];
        diagnostics.supabaseAuthTest = 'SUCCESS';
      } catch (sbErr: any) {
        diagnostics.supabaseAuthTest = 'FAILED';
        diagnostics.supabaseAuthError = {
          message: sbErr.message,
          status: sbErr.status || 'N/A'
        };
      }
    }

    res.json(diagnostics);
  } catch (err: any) {
    res.status(500).json({ error: 'DIAGNOSTIC_FAILED', message: err.message });
  }
});

// Delete a Cloudinary asset or Supabase PDF by public_id/storage_path (Admin only)
router.delete('/file', authMiddleware, adminMiddleware, async (req, res) => {
  const { publicId, resourceType } = req.body;

  if (!publicId || !resourceType) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'publicId and resourceType are required to delete an asset'
    });
  }

  try {
    // Handle Supabase PDF deletion
    if (resourceType === 'supabase') {
      if (!isSupabaseConfigured) {
        return res.status(500).json({
          error: 'SUPABASE_NOT_CONFIGURED',
          message: 'Supabase is not configured on this server'
        });
      }

      console.log('[UPLOAD] Deleting Supabase PDF:', publicId);

      await deletePdfFromSupabase(publicId);
      return res.json({
        success: true,
        message: 'Supabase PDF deleted successfully'
      });
    }

    // Handle Cloudinary asset deletion
    if (!isCloudinaryConfigured) {
      return res.status(500).json({
        error: 'CLOUDINARY_NOT_CONFIGURED',
        message: 'Cloudinary is not configured on this server'
      });
    }

    console.log('[UPLOAD] Deleting Cloudinary asset:', publicId, 'resource_type:', resourceType);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.destroy(
        publicId,
        { resource_type: resourceType },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
    });

    console.log('[UPLOAD] Cloudinary delete result:', result);
    return res.json({
      success: true,
      result,
      message: result.result === 'ok' ? 'Asset deleted successfully' : `Cloudinary returned: ${result.result}`
    });
  } catch (err: any) {
    console.error('[UPLOAD] Delete error:', err.message);
    const isSupabase = resourceType === 'supabase';
    const errorCode = isSupabase ? 'SUPABASE_DELETE_FAILED' : 'CLOUDINARY_DELETE_FAILED';
    return res.status(500).json({
      error: errorCode,
      message: `${isSupabase ? 'Supabase' : 'Cloudinary'} delete failed: ${err.message}`
    });
  }
});

export default router;
