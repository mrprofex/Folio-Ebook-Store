const https = require('https');
const crypto = require('crypto');

const cloudName = 'dyq660t7z';
const apiKey = '911181754718435';
const apiSecret = 'sWg0j5fPdwhiDn4iIm_P726Tx2M';
const publicId = 'ebooks/1788879839483-axs0ky';

const timestamp = Math.floor(Date.now() / 1000);

for (const resourceType of ['image', 'raw']) {
  // Cloudinary download API expects: format, public_id, resource_type, timestamp
  // But the error shows that for raw, resource_type was NOT in the expected string.
  // Let's try without resource_type first.
  const stringToSign = `format=pdf&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto.createHash('sha1').update(stringToSign + apiSecret).digest('hex');

  const url = new URL(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/download`);
  url.searchParams.set('timestamp', timestamp);
  url.searchParams.set('public_id', publicId);
  url.searchParams.set('format', 'pdf');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('signature', signature);

  console.log(`\nTesting ${resourceType}: ${url.toString()}`);

  https.get(url.toString(), (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('Response:', data.substring(0, 300));
    });
  }).on('error', (err) => {
    console.error('Error:', err.message);
  });
}
