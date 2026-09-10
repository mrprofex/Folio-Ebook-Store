const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const filePath = 'C:\\Users\\Vivek\\AppData\\Local\\Temp\\kilo\\original_test.pdf';
const buffer = fs.readFileSync(filePath);

console.log('Uploading directly via SDK...');

const uploadStream = cloudinary.uploader.upload_stream(
  {
    folder: 'ebooks',
    resource_type: 'image',
    upload_preset: 'folio_uploads',
    unsigned: true,
    public_id: `direct-test-${Date.now()}`,
    filename_override: 'direct_test.pdf'
  },
  (error, result) => {
    if (error) {
      console.error('Error:', error.message);
      console.error('HTTP code:', error.http_code);
      if (error.response) {
        console.error('Response:', JSON.stringify(error.response.data).substring(0, 500));
      }
    } else {
      console.log('Success!');
      console.log('URL:', result.secure_url);
      console.log('Public ID:', result.public_id);
      console.log('Resource type:', result.resource_type);
      console.log('Format:', result.format);
      console.log('Width:', result.width);
      console.log('Height:', result.height);
    }
  }
);

const { Readable } = require('stream');
const stream = Readable.from(buffer);
stream.pipe(uploadStream);
