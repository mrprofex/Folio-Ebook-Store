const fs = require('fs');
const { execFileSync } = require('child_process');

// Read DATABASE_URL from .env without printing it
const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
if (!match) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}
const dbUrl = match[1];

// Write URL to a temp file to avoid shell parsing issues
const tmpFile = 'tmp_db_url.txt';
fs.writeFileSync(tmpFile, dbUrl);

// Use cmd.exe to run vercel with @file reference
try {
  const result = execFileSync('cmd.exe', ['/c', 'vercel', 'env', 'update', 'DATABASE_URL', '@' + tmpFile, 'production'], {
    stdio: 'pipe',
    encoding: 'utf8',
    env: { ...process.env }
  });
  console.log(result);
} catch (err) {
  console.error('Error:', err.message);
  if (err.stderr) console.error('stderr:', err.stderr);
} finally {
  fs.unlinkSync(tmpFile);
}