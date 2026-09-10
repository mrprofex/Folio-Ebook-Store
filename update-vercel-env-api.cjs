const fs = require('fs');
const https = require('https');

// Read DATABASE_URL from .env without printing it
const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!match) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}
const dbUrl = match[1];

// Read Vercel project config
const repoConfig = JSON.parse(fs.readFileSync('.vercel/repo.json', 'utf8'));
const project = repoConfig.projects[0];
const projectId = project.id;

// Read auth token
let authToken = null;
try {
  const authFile = fs.readFileSync('.vercel/.vercel/auth.json', 'utf8');
  const auth = JSON.parse(authFile);
  authToken = auth.token || auth.accessToken;
} catch (e) {
  console.error('Could not read Vercel auth token. Please run vercel login first.');
  process.exit(1);
}

// Use Vercel REST API to update DATABASE_URL
const data = JSON.stringify({
  type: 'encrypted',
  value: dbUrl,
  target: ['production', 'preview']
});

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${projectId}/env/DATABASE_URL`,
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + authToken,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('Vercel DATABASE_URL updated successfully');
    } else {
      console.error('Vercel API error:', res.statusCode, body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();