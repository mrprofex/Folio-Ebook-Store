import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables.');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });

async function seed() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL for seeding.');

    await client.query('BEGIN');

    const storePath = path.join(process.cwd(), 'data', 'store.json');
    const raw = fs.readFileSync(storePath, 'utf-8');
    const store = JSON.parse(raw);

    for (const cat of store.categories) {
      await client.query(
        `INSERT INTO categories (id, name, slug, description, is_active, ebook_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [cat.id, cat.name, cat.slug, cat.description || '', cat.isActive, 0, cat.createdAt, cat.updatedAt]
      );
    }
    console.log(`Seeded ${store.categories.length} categories.`);

    for (const user of store.users) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at, last_login_at, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt, user.lastLoginAt || null, user.isActive]
      );
    }
    console.log(`Seeded ${store.users.length} users.`);

    for (const ebook of store.ebooks) {
      await client.query(
        `INSERT INTO ebooks (
          id, title, slug, description, author, category, price, currency, cover_image_url, cover_public_id,
          pdf_url, pdf_public_id, cloudinary_resource_type, file_size, page_count, featured, published, download_count,
          sample_chapter, created_at, updated_at, publication_type, combo_items, total_original_value, has_bonus,
          bonus_items, bonus_type, bonus_ebook_id, bonus_title, bonus_description, bonus_cover_image_url,
          bonus_pdf_url, bonus_page_count, bonus_file_size
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30, $31,
          $32, $33, $34
        )
        ON CONFLICT (id) DO NOTHING`,
        [
          ebook.id,
          ebook.title,
          ebook.slug,
          ebook.description,
          ebook.author,
          ebook.category,
          ebook.price,
          ebook.currency || 'INR',
          ebook.coverImageUrl,
          ebook.coverPublicId || null,
          ebook.pdfUrl,
          ebook.pdfPublicId || null,
          ebook.cloudinaryResourceType || null,
          ebook.fileSize,
          ebook.pageCount,
          ebook.featured,
          ebook.published,
          ebook.downloadCount || 0,
          ebook.sampleChapter || null,
          ebook.createdAt,
          ebook.updatedAt,
          ebook.publicationType || 'SINGLE',
          JSON.stringify(ebook.comboItems || null),
          ebook.totalOriginalValue || null,
          ebook.hasBonus || false,
          JSON.stringify(ebook.bonusItems || null),
          ebook.bonusType || 'custom',
          ebook.bonusEbookId || null,
          ebook.bonusTitle || null,
          ebook.bonusDescription || null,
          ebook.bonusCoverImageUrl || null,
          ebook.bonusPdfUrl || null,
          ebook.bonusPageCount || 50,
          ebook.bonusFileSize || '5.0 MB'
        ]
      );
    }
    console.log(`Seeded ${store.ebooks.length} ebooks.`);

    for (const coupon of store.coupons) {
      await client.query(
        `INSERT INTO coupons (
          id, code, ebook_id, discount_percentage, expires_at, usage_limit, usage_count,
          unlimited_usage, is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11
        )
        ON CONFLICT (id) DO NOTHING`,
        [
          coupon.id,
          coupon.code,
          coupon.ebookId,
          coupon.discountPercentage,
          coupon.expiresAt,
          coupon.usageLimit,
          coupon.usageCount,
          coupon.unlimitedUsage,
          coupon.isActive,
          coupon.createdAt,
          coupon.updatedAt
        ]
      );
    }
    console.log(`Seeded ${store.coupons.length} coupons.`);

    for (const purchase of store.purchases) {
      await client.query(
        `INSERT INTO purchases (
          id, user_id, ebook_id, amount, original_amount, discount_amount, final_amount, currency,
          razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status, purchased_at,
          download_count, last_downloaded_at, publication_type, combo_items_snapshot, entitlements,
          coupon_id, coupon_code_snapshot, has_bonus, bonus_items_snapshot, bonus_ebook_id,
          bonus_title, bonus_cover_image_url, bonus_download_count, bonus_last_downloaded_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23,
          $24, $25, $26, $27
        )
        ON CONFLICT (id) DO NOTHING`,
        [
          purchase.id,
          purchase.userId,
          purchase.ebookId,
          purchase.amount,
          purchase.originalAmount || null,
          purchase.discountAmount || null,
          purchase.finalAmount || null,
          purchase.currency,
          purchase.razorpayOrderId,
          purchase.razorpayPaymentId || null,
          purchase.razorpaySignature || null,
          purchase.paymentStatus,
          purchase.purchasedAt,
          purchase.downloadCount || 0,
          purchase.lastDownloadedAt || null,
          purchase.publicationType || 'SINGLE',
          JSON.stringify(purchase.comboItemsSnapshot || null),
          JSON.stringify(purchase.entitlements || null),
          purchase.couponId || null,
          purchase.couponCodeSnapshot || null,
          purchase.hasBonus || false,
          JSON.stringify(purchase.bonusItemsSnapshot || null),
          purchase.bonusEbookId || null,
          purchase.bonusTitle || null,
          purchase.bonusCoverImageUrl || null,
          purchase.bonusDownloadCount || 0,
          purchase.bonusLastDownloadedAt || null
        ]
      );
    }
    console.log(`Seeded ${store.purchases.length} purchases.`);

    for (const usage of store.couponUsages) {
      await client.query(
        `INSERT INTO coupon_usages (id, coupon_id, user_id, purchase_id, used_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [usage.id, usage.couponId, usage.userId, usage.purchaseId, usage.usedAt]
      );
    }
    console.log(`Seeded ${store.couponUsages.length} coupon usages.`);

    await client.query('COMMIT');
    console.log('All data seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
