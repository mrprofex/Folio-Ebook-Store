const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const baseUrl = (process.env.APP_URL || 'https://folio-ebook.vercel.app').replace(/\/$/, '');
const now = new Date().toISOString();

function addUrl(loc, lastmod, changefreq = 'weekly', priority = '0.8') {
  const escapedLoc = loc.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
  let lastmodStr = now;
  if (lastmod) {
    if (lastmod instanceof Date) {
      lastmodStr = lastmod.toISOString();
    } else {
      lastmodStr = lastmod;
    }
  }
  const escapedLastmod = lastmodStr.replace(/&/g, '&').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
  return `<url>\n  <loc>${escapedLoc}</loc>\n  <lastmod>${escapedLastmod}</lastmod>\n  <changefreq>${changefreq}</changefreq>\n  <priority>${priority}</priority>\n</url>`;
}

async function generateSitemap() {
  const urls = [];

  urls.push(addUrl(`${baseUrl}/`, now, 'daily', '1.0'));
  urls.push(addUrl(`${baseUrl}/ebooks`, now, 'daily', '0.9'));
  urls.push(addUrl(`${baseUrl}/about`, now, 'monthly', '0.6'));
  urls.push(addUrl(`${baseUrl}/terms`, now, 'monthly', '0.5'));
  urls.push(addUrl(`${baseUrl}/privacy-policy`, now, 'monthly', '0.5'));
  urls.push(addUrl(`${baseUrl}/refunds`, now, 'monthly', '0.5'));
  urls.push(addUrl(`${baseUrl}/contact`, now, 'monthly', '0.5'));
  urls.push(addUrl(`${baseUrl}/delivery`, now, 'monthly', '0.5'));

  try {
    const result = await pool.query("SELECT slug, updated_at, created_at FROM ebooks WHERE published = true AND slug IS NOT NULL");
    for (const ebook of result.rows) {
      if (ebook.slug) {
        urls.push(addUrl(`${baseUrl}/ebooks/${ebook.slug}`, ebook.updated_at || ebook.created_at, 'weekly', '0.8'));
      }
    }
  } catch (err) {
    console.error('Error fetching ebooks for sitemap:', err);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  const publicDir = path.join(process.cwd(), 'public');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  
  fs.writeFileSync(sitemapPath, xml);
  console.log(`Sitemap generated at ${sitemapPath}`);
  console.log(`Total URLs: ${urls.length}`);
  
  await pool.end();
}

generateSitemap().catch(err => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});