import { Client } from 'pg';
import dotenv from 'dotenv';

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

    // Add original_price column to ebooks table
    // Default to current price for existing rows
    await client.query(`
      ALTER TABLE ebooks 
      ADD COLUMN IF NOT EXISTS original_price NUMERIC(12,2);
    `);

    // Update existing rows: set original_price = price where original_price is null
    await client.query(`
      UPDATE ebooks 
      SET original_price = price 
      WHERE original_price IS NULL;
    `);

    // Now make it NOT NULL with a default
    await client.query(`
      ALTER TABLE ebooks 
      ALTER COLUMN original_price SET NOT NULL,
      ALTER COLUMN original_price SET DEFAULT 0;
    `);

    await client.query('COMMIT');
    console.log('Migration completed: original_price column added to ebooks table.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();