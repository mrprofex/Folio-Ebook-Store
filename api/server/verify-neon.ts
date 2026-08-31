import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function verify() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to Neon PostgreSQL for verification.');

  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
  );
  console.log('\n=== TABLES ===');
  console.log(tables.rows.map((r: any) => r.table_name).join(', '));

  const counts: Record<string, number> = {};
  for (const t of ['users', 'categories', 'ebooks', 'coupons', 'purchases', 'coupon_usages']) {
    const res = await client.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
    counts[t] = res.rows[0].c;
  }
  console.log('\n=== ROW COUNTS ===');
  console.log(counts);

  console.log('\n=== USERS ===');
  const users = await client.query('SELECT id, name, email, role, is_active FROM users');
  console.log(users.rows);

  console.log('\n=== EBOOKS (sample) ===');
  const ebooks = await client.query(
    'SELECT id, title, slug, price, currency, published, featured, has_bonus FROM ebooks ORDER BY created_at'
  );
  console.log(ebooks.rows);

  console.log('\n=== COUPONS ===');
  const coupons = await client.query('SELECT id, code, ebook_id, discount_percentage, usage_count, is_active FROM coupons');
  console.log(coupons.rows);

  console.log('\n=== PURCHASES ===');
  const purchases = await client.query(
    "SELECT id, user_id, ebook_id, amount, payment_status, purchased_at FROM purchases ORDER BY purchased_at"
  );
  console.log(purchases.rows);

  console.log('\n=== COUPON USAGES ===');
  const usages = await client.query('SELECT id, coupon_id, user_id, purchase_id FROM coupon_usages');
  console.log(usages.rows);

  await client.end();
  console.log('\nVerification complete.');
}

verify().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
