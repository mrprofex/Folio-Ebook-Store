const https = require('https');
const crypto = require('crypto');

const cloudName = 'dyq660t7z';
const apiKey = '911181754718435';
const apiSecret = 'sWg0j5fPdwhiDn4iIm_P726Tx2M';
const publicId = 'ebooks/1788879839483-axs0ky';

const timestamp = Math.floor(Date.now() / 1000);

// Cloudinary expects parameters sorted alphabetically for the signature
const stringToSign = `format=pdf&public_id=${publicId}&timestamp=${timestamp}`;
const signature = crypto.createHash('sha1').update(stringToSign + apiSecret).digest('hex');

const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/image/download`);
url.searchParams.set('timestamp', timestamp);
url.searchParams.set('public_id', publicId);
url.searchParams.set('format', 'pdf');
url.searchParams.set('api_key', apiKey);
url.searchParams.set('signature', signature);

console.log('Download URL:', url.toString());

const req = https.get(url.toString(), (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', data.substring(0, 500));
  });
});

req.on('error', (err) => {
  console.error('Error:', err.message);
});
