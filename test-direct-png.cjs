const cloudinary = require('cloudinary').v2;
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const filePath = 'C:\\Users\\Vivek\\AppData\\Local\\Temp\\kilo\\direct_test.png';
const buffer = fs.readFileSync(filePath);

console.log('Uploading PNG directly via SDK...');

const uploadStream = cloudinary.uploader.upload_stream(
  {
    folder: 'ebooks/covers',
    resource_type: 'image',
    upload_preset: 'folio_uploads',
    unsigned: true,
    public_id: `direct-test-png-${Date.now()}`
  },
  (error, result) => {
    if (error) {
      console.error('Error:', error.message);
    } else {
      console.log('Success!');
      console.log('URL:', result.secure_url);
      console.log('Public ID:', result.public_id);
      console.log('Resource type:', result.resource_type);
    }
  }
);

const { Readable } = require('stream');
const stream = Readable.from(buffer);
stream.pipe(uploadStream);
