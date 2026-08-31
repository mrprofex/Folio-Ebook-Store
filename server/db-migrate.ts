import { Client } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import {
  INITIAL_CATEGORIES,
  INITIAL_EBOOKS,
  INITIAL_COUPONS,
  buildSeedUsers,
  buildDemoPurchases,
  buildDemoUsages
} from './seed-data';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL.');

    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT DEFAULT '',
        is_active BOOLEAN DEFAULT TRUE,
        ebook_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ebooks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL,
        price NUMERIC(12,2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        cover_image_url TEXT NOT NULL,
        cover_public_id TEXT,
        pdf_url TEXT NOT NULL,
        pdf_public_id TEXT,
        cloudinary_resource_type TEXT,
        file_size TEXT NOT NULL,
        page_count INTEGER NOT NULL,
        featured BOOLEAN DEFAULT FALSE,
        published BOOLEAN DEFAULT FALSE,
        download_count INTEGER DEFAULT 0,
        sample_chapter TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        publication_type TEXT DEFAULT 'SINGLE',
        combo_items JSONB,
        total_original_value NUMERIC(12,2),
        has_bonus BOOLEAN DEFAULT FALSE,
        bonus_items JSONB,
        bonus_type TEXT DEFAULT 'custom',
        bonus_ebook_id TEXT,
        bonus_title TEXT,
        bonus_description TEXT,
        bonus_cover_image_url TEXT,
        bonus_pdf_url TEXT,
        bonus_page_count INTEGER DEFAULT 50,
        bonus_file_size TEXT DEFAULT '5.0 MB'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        ebook_id TEXT NOT NULL REFERENCES ebooks(id),
        amount NUMERIC(12,2) NOT NULL,
        original_amount NUMERIC(12,2),
        discount_amount NUMERIC(12,2) DEFAULT 0,
        final_amount NUMERIC(12,2),
        currency TEXT NOT NULL DEFAULT 'INR',
        razorpay_order_id TEXT NOT NULL UNIQUE,
        razorpay_payment_id TEXT,
        razorpay_signature TEXT,
        payment_status TEXT NOT NULL DEFAULT 'PENDING',
        purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        download_count INTEGER DEFAULT 0,
        last_downloaded_at TIMESTAMP WITH TIME ZONE,
        publication_type TEXT DEFAULT 'SINGLE',
        combo_items_snapshot JSONB,
        entitlements JSONB,
        coupon_id TEXT,
        coupon_code_snapshot TEXT,
        has_bonus BOOLEAN DEFAULT FALSE,
        bonus_items_snapshot JSONB,
        bonus_ebook_id TEXT,
        bonus_title TEXT,
        bonus_cover_image_url TEXT,
        bonus_download_count INTEGER DEFAULT 0,
        bonus_last_downloaded_at TIMESTAMP WITH TIME ZONE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        ebook_id TEXT NOT NULL REFERENCES ebooks(id),
        discount_percentage INTEGER NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        usage_limit INTEGER DEFAULT 100,
        usage_count INTEGER DEFAULT 0,
        unlimited_usage BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id TEXT PRIMARY KEY,
        coupon_id TEXT NOT NULL REFERENCES coupons(id),
        user_id TEXT NOT NULL REFERENCES users(id),
        purchase_id TEXT NOT NULL REFERENCES purchases(id),
        used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ebooks_slug ON ebooks(slug);
      CREATE INDEX IF NOT EXISTS idx_ebooks_category ON ebooks(category);
      CREATE INDEX IF NOT EXISTS idx_ebooks_published ON ebooks(published);
      CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_ebook_id ON purchases(ebook_id);
      CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(payment_status);
      CREATE INDEX IF NOT EXISTS idx_coupons_ebook_id ON coupons(ebook_id);
      CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON coupon_usages(user_id);
      CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id);
    `);

    // --- Seed Users ---
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.warn('[migrate] ADMIN_EMAIL or ADMIN_PASSWORD is not set. Skipping admin user seed.');
    } else {
      const users = buildSeedUsers(adminEmail, adminPassword);
      for (const u of users) {
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at, last_login_at, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (email) DO NOTHING;`,
          [u.id, u.name, u.email, u.passwordHash, u.role, u.createdAt, u.updatedAt, u.lastLoginAt, u.isActive]
        );
      }
      console.log(`Seeded ${users.length} users.`);
    }

    // --- Seed Categories ---
    for (const c of INITIAL_CATEGORIES) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, is_active, ebook_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 0, $6, $7)
         ON CONFLICT (id) DO NOTHING;`,
        [c.id, c.name, c.slug, c.description || '', c.isActive, c.createdAt, c.updatedAt]
      );
    }
    console.log(`Seeded ${INITIAL_CATEGORIES.length} categories.`);

    // --- Seed Ebooks ---
    for (const e of INITIAL_EBOOKS) {
      await client.query(
        `INSERT INTO ebooks (
          id, title, slug, description, author, category, price, currency, cover_image_url,
          cover_public_id, pdf_url, pdf_public_id, cloudinary_resource_type, file_size, page_count,
          featured, published, download_count, sample_chapter, created_at, updated_at,
          publication_type, combo_items, total_original_value, has_bonus, bonus_items,
          bonus_type, bonus_ebook_id, bonus_title, bonus_description, bonus_cover_image_url,
          bonus_pdf_url, bonus_page_count, bonus_file_size
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
          $22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34
        )
        ON CONFLICT (id) DO NOTHING;`,
        [
          e.id, e.title, e.slug, e.description, e.author, e.category, e.price, e.currency || 'INR',
          e.coverImageUrl, e.coverPublicId ?? null, e.pdfUrl, e.pdfPublicId ?? null, e.cloudinaryResourceType ?? null,
          e.fileSize, e.pageCount, e.featured ?? false, e.published ?? false, e.downloadCount ?? 0, e.sampleChapter ?? null,
          e.createdAt, e.updatedAt,           e.publicationType || 'SINGLE', e.comboItems ? JSON.stringify(e.comboItems) : null, e.totalOriginalValue ?? null,
          e.hasBonus ?? false, e.bonusItems ? JSON.stringify(e.bonusItems) : null, e.bonusType || 'custom', e.bonusEbookId ?? null,
          e.bonusTitle ?? null, e.bonusDescription ?? null, e.bonusCoverImageUrl ?? null, e.bonusPdfUrl ?? null,
          e.bonusPageCount ?? null, e.bonusFileSize ?? null
        ]
      );
    }
    console.log(`Seeded ${INITIAL_EBOOKS.length} ebooks.`);

    // --- Seed Coupons ---
    for (const cp of INITIAL_COUPONS) {
      await client.query(
        `INSERT INTO coupons (id, code, ebook_id, discount_percentage, expires_at, usage_limit, usage_count, unlimited_usage, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING;`,
        [cp.id, cp.code, cp.ebookId, cp.discountPercentage, cp.expiresAt, cp.usageLimit, cp.usageCount, cp.unlimitedUsage, cp.isActive, cp.createdAt, cp.updatedAt]
      );
    }
    console.log(`Seeded ${INITIAL_COUPONS.length} coupons.`);

    // --- Seed Demo Purchases ---
    const demoPurchases = buildDemoPurchases();
    for (const p of demoPurchases) {
      await client.query(
        `INSERT INTO purchases (
          id, user_id, ebook_id, amount, original_amount, discount_amount, final_amount, currency,
          razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status, purchased_at,
          download_count, last_downloaded_at, publication_type, combo_items_snapshot, entitlements,
          coupon_id, coupon_code_snapshot, has_bonus, bonus_items_snapshot, bonus_ebook_id,
          bonus_title, bonus_cover_image_url, bonus_download_count, bonus_last_downloaded_at
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
        )
        ON CONFLICT (id) DO NOTHING;`,
        [
          p.id, p.userId, p.ebookId, p.amount, p.originalAmount ?? p.amount, p.discountAmount ?? 0, p.finalAmount ?? p.amount, p.currency,
          p.razorpayOrderId, p.razorpayPaymentId, p.razorpaySignature, p.paymentStatus, p.purchasedAt,
          p.downloadCount ?? 0, p.lastDownloadedAt ?? null,           p.publicationType ?? 'SINGLE', p.comboItemsSnapshot ? JSON.stringify(p.comboItemsSnapshot) : null, p.entitlements ? JSON.stringify(p.entitlements) : null,
          p.couponId ?? null, p.couponCodeSnapshot ?? null, p.hasBonus ?? false, p.bonusItemsSnapshot ? JSON.stringify(p.bonusItemsSnapshot) : null, p.bonusEbookId ?? null,
          p.bonusTitle ?? null, p.bonusCoverImageUrl ?? null, p.bonusDownloadCount ?? 0, p.bonusLastDownloadedAt ?? null
        ]
      );
    }
    console.log(`Seeded ${demoPurchases.length} demo purchases.`);

    // --- Seed Demo Coupon Usages ---
    const demoUsages = buildDemoUsages();
    for (const u of demoUsages) {
      await client.query(
        `INSERT INTO coupon_usages (id, coupon_id, user_id, purchase_id, used_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING;`,
        [u.id, u.couponId, u.userId, u.purchaseId, u.usedAt]
      );
    }
    console.log(`Seeded ${demoUsages.length} coupon usages.`);

    await client.query('COMMIT');
    console.log('Schema migration and seeding completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
