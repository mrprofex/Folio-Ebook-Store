const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const publicId = 'ebooks/1788879839483-axs0ky';
const resourceType = 'image';

(async () => {
console.log('Testing signed URL generation...');

// Test 1: Simple signed URL
const signedUrl = cloudinary.url(publicId, {
  resource_type: resourceType,
  format: 'pdf',
  sign_url: true
});
console.log('Signed URL:', signedUrl);

// Test 2: With attachment
const attachmentUrl = cloudinary.url(publicId, {
  resource_type: resourceType,
  format: 'pdf',
  sign_url: true,
  attachment: true
});
console.log('Attachment URL:', attachmentUrl);

// Test 3: private_download_url
if (typeof cloudinary.utils.private_download_url === 'function') {
  const privateUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
    resource_type: resourceType
  });
  console.log('Private download URL:', privateUrl);
} else {
  console.log('private_download_url not available');
}

// Test 4: Check if file exists via API
try {
  const resource = await cloudinary.api.resource(publicId, {
    resource_type: resourceType
  });
  console.log('Resource exists:', resource.public_id, 'type:', resource.resource_type, 'format:', resource.format);
} catch (err) {
  console.error('API resource error:', err.message);
}
})();
