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
  try {
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });
    console.log('Resource found:', JSON.stringify(resource, null, 2).substring(0, 500));
  } catch (err) {
    console.error('HTTP code:', err.http_code);
    console.error('Message:', err.message);
    console.error('Error:', JSON.stringify(err, null, 2).substring(0, 1000));
  }
})();
