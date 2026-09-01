import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware, adminMiddleware } from '../auth.js';

const router = Router();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const COVERS_DIR = path.join(UPLOADS_DIR, 'covers');
const PDFS_DIR = path.join(UPLOADS_DIR, 'pdfs');

try {
  [UPLOADS_DIR, COVERS_DIR, PDFS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
} catch (err) {
  console.warn('Could not create upload directories (read-only filesystem?):', err);
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, COVERS_DIR);
    } else {
      cb(null, PDFS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
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
    const localRelativePath = isImage
      ? `/uploads/covers/${req.file.filename}`
      : `/uploads/pdfs/${req.file.filename}`;

    // If Cloudinary configured, attempt upload to Cloudinary
    if (isCloudinaryConfigured) {
      try {
        const folder = isImage ? 'ebooks/covers' : 'ebooks/pdfs';
        const resourceType = isImage ? 'image' : 'raw';
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder,
          resource_type: resourceType
        });

        return res.json({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
          filename: req.file.originalname
        });
      } catch (cloudErr) {
        console.warn('Cloudinary upload fallback to local storage:', cloudErr);
      }
    }

    // Return local asset URL
    return res.json({
      url: localRelativePath,
      publicId: req.file.filename,
      resourceType: isImage ? 'image' : 'raw',
      fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
      filename: req.file.originalname
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return res.status(500).json({ error: 'UPLOAD_FAILED', message: err.message || 'File upload failed' });
  }
});

export default router;
