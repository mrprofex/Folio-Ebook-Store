const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const filePath = 'C:\\Users\\Vivek\\AppData\\Local\\Temp\\kilo\\original_test.pdf';
const buffer = fs.readFileSync(filePath);

console.log('Testing signed upload...');

const timestamp = Math.floor(Date.now() / 1000);
const publicId = `signed-test-${Date.now()}`;
const folder = 'ebooks';

const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}&upload_preset=folio_uploads`;
const signature = crypto.createHash('sha1').update(paramsToSign + cloudinary.config().api_secret).digest('hex');

const FormData = require('form-data');
const form = new FormData();
form.append('file', buffer, { filename: 'test.pdf' });
form.append('api_key', cloudinary.config().api_key);
form.append('timestamp', timestamp);
form.append('signature', signature);
form.append('public_id', publicId);
form.append('folder', folder);

const req = require('https').request({
  hostname: 'api.cloudinary.com',
  path: `/v1_1/${cloudinary.config().cloud_name}/image/upload`,
  method: 'POST',
  headers: form.getHeaders()
}, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});

form.pipe(req);
