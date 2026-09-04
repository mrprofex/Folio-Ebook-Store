import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware, adminMiddleware } from '../auth.js';

const router = Router();

// Use memory storage for Vercel serverless compatibility (read-only filesystem)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Initialize Cloudinary if configured
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  !process.env.CLOUDINARY_CLOUD_NAME.includes('sample')
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Upload endpoint (Admin only)
router.post('/file', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    // Safe diagnostic logging
    console.log('[UPLOAD] Cloudinary configured:', isCloudinaryConfigured);
    console.log('[UPLOAD] CLOUDINARY_CLOUD_NAME exists:', Boolean(process.env.CLOUDINARY_CLOUD_NAME));
    console.log('[UPLOAD] CLOUDINARY_API_KEY exists:', Boolean(process.env.CLOUDINARY_API_KEY));
    console.log('[UPLOAD] CLOUDINARY_API_SECRET exists:', Boolean(process.env.CLOUDINARY_API_SECRET));
    
    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'No file was uploaded' });
    }

    console.log('[UPLOAD] File received:', req.file.originalname, req.file.mimetype, req.file.size);
    
    // Validate PDF files
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
    console.log('[UPLOAD] Is image:', isImage, 'Is PDF:', isPdf, 'Resource type:', resourceType);

    // If Cloudinary configured, upload to Cloudinary from memory buffer
    if (isCloudinaryConfigured) {
      try {
        const folder = isImage ? 'ebooks/covers' : 'ebooks/pdfs';
        
        console.log('[UPLOAD] Uploading to Cloudinary - folder:', folder, 'resource_type:', resourceType);
        
        // Convert buffer to base64 for Cloudinary upload
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        console.log('[UPLOAD] Base64 data URI length:', fileBase64.length);
        
        const result = await cloudinary.uploader.upload(fileBase64, {
          folder,
          resource_type: resourceType,
          public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          use_filename: true,
          unique_filename: true
        });

        console.log('[UPLOAD] Cloudinary upload success:', result.public_id);
        return res.json({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
          filename: req.file.originalname
        });
      } catch (cloudErr: any) {
        console.error('[UPLOAD] Cloudinary upload error:', cloudErr.message);
        console.error('[UPLOAD] Cloudinary error code:', cloudErr.http_code || cloudErr.code || 'N/A');
        console.error('[UPLOAD] Cloudinary error details:', JSON.stringify(cloudErr, null, 2));
        
        // Return actual Cloudinary error details without exposing secrets
        const errorMessage = cloudErr.message || 'Cloudinary upload failed';
        const errorCode = cloudErr.http_code || cloudErr.code || 'UNKNOWN';
        
        return res.status(500).json({ 
          error: 'CLOUDINARY_UPLOAD_FAILED', 
          message: `Cloudinary upload failed (Error ${errorCode}): ${errorMessage}` 
        });
      }
    }

    // Cloudinary is required for Vercel deployment (no local filesystem)
    console.log('[UPLOAD] Cloudinary not configured');
    return res.status(500).json({ 
      error: 'CLOUDINARY_NOT_CONFIGURED', 
      message: 'Cloudinary is required for file uploads on Vercel. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' 
    });
  } catch (err: any) {
    console.error('[UPLOAD] File upload error:', err.message);
    return res.status(500).json({ error: 'UPLOAD_FAILED', message: err.message || 'File upload failed' });
  }
});

export default router;
