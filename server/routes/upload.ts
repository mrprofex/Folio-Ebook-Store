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
    if (!req.file) {
      return res.status(400).json({ error: 'NO_FILE', message: 'No file was uploaded' });
    }

    const isImage = req.file.mimetype.startsWith('image/');

    // If Cloudinary configured, upload to Cloudinary from memory buffer
    if (isCloudinaryConfigured) {
      try {
        const folder = isImage ? 'ebooks/covers' : 'ebooks/pdfs';
        const resourceType = isImage ? 'image' : 'raw';
        
        // Convert buffer to base64 for Cloudinary upload
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const result = await cloudinary.uploader.upload(fileBase64, {
          folder,
          resource_type: resourceType,
          public_id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        });

        return res.json({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
          filename: req.file.originalname
        });
      } catch (cloudErr) {
        console.error('Cloudinary upload error:', cloudErr);
        return res.status(500).json({ 
          error: 'CLOUDINARY_UPLOAD_FAILED', 
          message: 'Failed to upload to Cloudinary. Please check Cloudinary configuration.' 
        });
      }
    }

    // Cloudinary is required for Vercel deployment (no local filesystem)
    return res.status(500).json({ 
      error: 'CLOUDINARY_NOT_CONFIGURED', 
      message: 'Cloudinary is required for file uploads on Vercel. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.' 
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'UPLOAD_FAILED', message: err.message || 'File upload failed' });
  }
});

export default router;
