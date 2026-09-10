const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

(async () => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'ebooks/',
      max_results: 10
    });
    console.log('Resources:', JSON.stringify(result, null, 2).substring(0, 1000));
  } catch (err) {
    console.error('Error:', err.http_code, err.message);
  }
})();
