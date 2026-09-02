import { Pool } from 'pg';
import dotenv from 'dotenv';
import {
  User,
  Ebook,
  Purchase,
  Coupon,
  CouponUsage,
  DashboardStats,
  Category,
  BonusItem,
  ComboItem,
  AccessEntitlement,
  PublicationType
} from '../src/types.js';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[db] DATABASE_URL is not set. PostgreSQL-backed store requires it.');
}

const ssl =
  DATABASE_URL && (DATABASE_URL.includes('sslmode=require') || DATABASE_URL.includes('neon.tech'))
    ? { rejectUnauthorized: false }
    : undefined;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl,
  max: 10
});

// --- helpers ---
function iso(v: any): string | undefined {
  if (v == null) return undefined;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function num(v: any): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return isNaN(n) ? undefined : n;
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// pg serializes top-level arrays as Postgres array literals; force JSON text for JSONB columns
function jsonVal(v: any): any {
  return v == null ? null : JSON.stringify(v);
}

// --- row mappers (snake_case -> camelCase) ---
function mapUser(r: any): User {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
    lastLoginAt: iso(r.last_login_at),
    isActive: r.is_active
  };
}

function mapUserWithHash(r: any): User & { passwordHash: string } {
  return { ...mapUser(r), passwordHash: r.password_hash };
}

function mapCategory(r: any): Category {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? '',
    isActive: r.is_active,
    ebookCount: Number(r.ebook_count ?? 0),
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!
  };
}

function mapEbook(r: any): Ebook {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    author: r.author,
    category: r.category,
    price: Number(r.price),
    currency: r.currency,
    coverImageUrl: r.cover_image_url,
    coverPublicId: r.cover_public_id ?? undefined,
    pdfUrl: r.pdf_url,
    pdfPublicId: r.pdf_public_id ?? undefined,
    cloudinaryResourceType: r.cloudinary_resource_type ?? undefined,
    fileSize: r.file_size,
    pageCount: Number(r.page_count),
    featured: r.featured,
    published: r.published,
    downloadCount: Number(r.download_count ?? 0),
    sampleChapter: r.sample_chapter ?? undefined,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!,
    publicationType: (r.publication_type as PublicationType) ?? undefined,
    comboItems: r.combo_items ?? undefined,
    totalOriginalValue: num(r.total_original_value),
    hasBonus: r.has_bonus ?? undefined,
    bonusItems: r.bonus_items ?? undefined,
    bonusType: (r.bonus_type as any) ?? undefined,
    bonusEbookId: r.bonus_ebook_id ?? undefined,
    bonusTitle: r.bonus_title ?? undefined,
    bonusDescription: r.bonus_description ?? undefined,
    bonusCoverImageUrl: r.bonus_cover_image_url ?? undefined,
    bonusPdfUrl: r.bonus_pdf_url ?? undefined,
    bonusPageCount: num(r.bonus_page_count),
    bonusFileSize: r.bonus_file_size ?? undefined
  };
}

function mapCoupon(r: any): Coupon {
  return {
    id: r.id,
    code: r.code,
    ebookId: r.ebook_id,
    discountPercentage: Number(r.discount_percentage),
    expiresAt: iso(r.expires_at)!,
    usageLimit: Number(r.usage_limit),
    usageCount: Number(r.usage_count),
    unlimitedUsage: r.unlimited_usage,
    isActive: r.is_active,
    createdAt: iso(r.created_at)!,
    updatedAt: iso(r.updated_at)!
  };
}

function mapPurchase(r: any): Purchase {
  return {
    id: r.id,
    userId: r.user_id,
    ebookId: r.ebook_id,
    amount: Number(r.amount),
    originalAmount: num(r.original_amount),
    discountAmount: num(r.discount_amount),
    finalAmount: num(r.final_amount),
    currency: r.currency,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id ?? undefined,
    razorpaySignature: r.razorpay_signature ?? undefined,
    paymentStatus: r.payment_status,
    purchasedAt: iso(r.purchased_at)!,
    downloadCount: Number(r.download_count ?? 0),
    lastDownloadedAt: iso(r.last_downloaded_at),
    publicationType: (r.publication_type as PublicationType) ?? undefined,
    comboItemsSnapshot: r.combo_items_snapshot ?? undefined,
    entitlements: r.entitlements ?? undefined,
    couponId: r.coupon_id ?? undefined,
    couponCodeSnapshot: r.coupon_code_snapshot ?? undefined,
    hasBonus: r.has_bonus ?? undefined,
    bonusItemsSnapshot: r.bonus_items_snapshot ?? undefined,
    bonusEbookId: r.bonus_ebook_id ?? undefined,
    bonusTitle: r.bonus_title ?? undefined,
    bonusCoverImageUrl: r.bonus_cover_image_url ?? undefined,
    bonusDownloadCount: num(r.bonus_download_count),
    bonusLastDownloadedAt: iso(r.bonus_last_downloaded_at)
  };
}

function mapCouponUsage(r: any): CouponUsage {
  return {
    id: r.id,
    couponId: r.coupon_id,
    userId: r.user_id,
    purchaseId: r.purchase_id,
    usedAt: iso(r.used_at)!
  };
}

// camelCase field -> snake_case column maps for dynamic updates
const EBOOK_COLS: Record<string, string> = {
  title: 'title', slug: 'slug', description: 'description', author: 'author', category: 'category',
  price: 'price', currency: 'currency', coverImageUrl: 'cover_image_url', coverPublicId: 'cover_public_id',
  pdfUrl: 'pdf_url', pdfPublicId: 'pdf_public_id', cloudinaryResourceType: 'cloudinary_resource_type',
  fileSize: 'file_size', pageCount: 'page_count', featured: 'featured', published: 'published',
  sampleChapter: 'sample_chapter', publicationType: 'publication_type', comboItems: 'combo_items',
  totalOriginalValue: 'total_original_value', hasBonus: 'has_bonus', bonusItems: 'bonus_items',
  bonusType: 'bonus_type', bonusEbookId: 'bonus_ebook_id', bonusTitle: 'bonus_title',
  bonusDescription: 'bonus_description', bonusCoverImageUrl: 'bonus_cover_image_url',
  bonusPdfUrl: 'bonus_pdf_url', bonusPageCount: 'bonus_page_count', bonusFileSize: 'bonus_file_size'
};
const EBOOK_JSON = new Set(['comboItems', 'bonusItems']);

const USER_COLS: Record<string, string> = {
  name: 'name', email: 'email', role: 'role', lastLoginAt: 'last_login_at', isActive: 'is_active'
};

const CAT_COLS: Record<string, string> = {
  name: 'name', slug: 'slug', description: 'description', isActive: 'is_active'
};

const COUPON_COLS: Record<string, string> = {
  code: 'code', ebookId: 'ebook_id', discountPercentage: 'discount_percentage', expiresAt: 'expires_at',
  usageLimit: 'usage_limit', unlimitedUsage: 'unlimited_usage', isActive: 'is_active'
};

function buildUpdate(
  set: Record<string, any>,
  colMap: Record<string, string>,
  jsonKeys: Set<string> = new Set()
): { clause: string; values: any[] } {
  const parts: string[] = [];
  const values: any[] = [];
  for (const [k, v] of Object.entries(set)) {
    const col = colMap[k];
    if (!col) continue;
    values.push(jsonKeys.has(k) ? (v == null ? null : JSON.stringify(v)) : v);
    parts.push(`${col} = $${values.length}`);
  }
  return { clause: parts.join(', '), values };
}

class Database {
  // --- USER METHODS ---

  async findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (res.rows.length === 0) return null;
    return mapUserWithHash(res.rows[0]);
  }

  async findUserById(id: string): Promise<User | null> {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapUser(res.rows[0]);
  }

  async findUserWithHashById(id: string): Promise<(User & { passwordHash: string }) | null> {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapUserWithHash(res.rows[0]);
  }

  async createUser(data: { name: string; email: string; passwordHash: string; role?: 'USER' | 'ADMIN' }): Promise<User> {
    const id = genId('usr');
    const now = new Date().toISOString();
    const email = data.email.toLowerCase().trim();
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at, last_login_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, data.name.trim(), email, data.passwordHash, data.role || 'USER', now, now, now, true]
    );
    return (await this.findUserById(id))!;
  }

  async updateUser(id: string, updates: Partial<User & { passwordHash: string }>): Promise<User | null> {
    const set: Record<string, any> = { ...updates };
    if (set.passwordHash) {
      const { clause, values } = buildUpdate(set, { ...USER_COLS, passwordHash: 'password_hash' });
      await pool.query(
        `UPDATE users SET ${clause}, updated_at = NOW() WHERE id = $${values.length + 1}`,
        [...values, id]
      );
    } else {
      const { clause, values } = buildUpdate(set, USER_COLS);
      if (!clause) return this.findUserById(id);
      await pool.query(
        `UPDATE users SET ${clause}, updated_at = NOW() WHERE id = $${values.length + 1}`,
        [...values, id]
      );
    }
    return this.findUserById(id);
  }

  async getAllUsers(): Promise<(User & { purchaseCount: number; totalSpent: number })[]> {
    const usersRes = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
    const purchasesRes = await pool.query(
      "SELECT user_id, amount FROM purchases WHERE payment_status = 'SUCCESS'"
    );
    const agg: Record<string, { count: number; spent: number }> = {};
    for (const r of purchasesRes.rows) {
      if (!agg[r.user_id]) agg[r.user_id] = { count: 0, spent: 0 };
      agg[r.user_id].count += 1;
      agg[r.user_id].spent += Number(r.amount);
    }
    return usersRes.rows.map(u => {
      const user = mapUser(u);
      const a = agg[u.id] || { count: 0, spent: 0 };
      return {
        ...user,
        purchaseCount: a.count,
        totalSpent: Number(a.spent.toFixed(2))
      };
    });
  }

  // --- EBOOK METHODS ---

  private async loadAllCoupons(): Promise<Coupon[]> {
    const res = await pool.query('SELECT * FROM coupons');
    return res.rows.map(mapCoupon);
  }

  private async loadEbookMap(): Promise<Map<string, Ebook>> {
    const res = await pool.query('SELECT * FROM ebooks');
    const map = new Map<string, Ebook>();
    for (const r of res.rows) map.set(r.id, mapEbook(r));
    return map;
  }

  async getAllEbooks(options: {
    search?: string;
    category?: string;
    publishedOnly?: boolean;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'featured';
  } = {}): Promise<Ebook[]> {
    const params: any[] = [];
    let sql = 'SELECT * FROM ebooks WHERE 1 = 1';

    if (options.publishedOnly) {
      sql += ' AND published = TRUE';
    }
    if (options.category && options.category !== 'all') {
      params.push(options.category);
      sql += ` AND category = $${params.length}`;
    }
    if (options.search && options.search.trim()) {
      const q = `%${options.search.toLowerCase().trim()}%`;
      params.push(q, q, q, q);
      sql += ` AND (LOWER(title) LIKE $${params.length - 3} OR LOWER(description) LIKE $${params.length - 2} OR LOWER(author) LIKE $${params.length - 1} OR LOWER(COALESCE(bonus_title, '')) LIKE $${params.length})`;
    }

    const res = await pool.query(sql, params);
    let list = res.rows.map(mapEbook);

    if (options.sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (options.sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (options.sort === 'featured') {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const coupons = await this.loadAllCoupons();
    const ebookMap = await this.loadEbookMap();
    const out: Ebook[] = [];
    for (const e of list) out.push(await this.enrichEbook(e, coupons, ebookMap));
    return out;
  }

  async findEbookById(id: string): Promise<Ebook | null> {
    const res = await pool.query('SELECT * FROM ebooks WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.enrichEbook(mapEbook(res.rows[0]));
  }

  async findEbookBySlug(slug: string): Promise<Ebook | null> {
    const res = await pool.query('SELECT * FROM ebooks WHERE slug = $1 OR id = $1', [slug]);
    if (res.rows.length === 0) return null;
    return this.enrichEbook(mapEbook(res.rows[0]));
  }

  async createEbook(data: Omit<Ebook, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<Ebook> {
    const id = genId('ebk');
    const now = new Date().toISOString();
    await pool.query(
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
      )`,
      [
        id, data.title, data.slug, data.description, data.author, data.category, data.price, data.currency || 'INR',
        data.coverImageUrl, data.coverPublicId ?? null, data.pdfUrl, data.pdfPublicId ?? null, data.cloudinaryResourceType ?? null,
        data.fileSize, data.pageCount, data.featured ?? false, data.published ?? false, 0, data.sampleChapter ?? null,
        now, now,         data.publicationType || 'SINGLE', jsonVal(data.comboItems), data.totalOriginalValue ?? null,
        data.hasBonus ?? false, jsonVal(data.bonusItems), data.bonusType || 'custom', data.bonusEbookId ?? null,
        data.bonusTitle ?? null, data.bonusDescription ?? null, data.bonusCoverImageUrl ?? null, data.bonusPdfUrl ?? null,
        data.bonusPageCount ?? null, data.bonusFileSize ?? null
      ]
    );
    return (await this.findEbookById(id))!;
  }

  async updateEbook(id: string, updates: Partial<Ebook>): Promise<Ebook | null> {
    const set: Record<string, any> = { ...updates };
    const { clause, values } = buildUpdate(set, EBOOK_COLS, EBOOK_JSON);
    if (!clause) return this.findEbookById(id);
    await pool.query(
      `UPDATE ebooks SET ${clause}, updated_at = NOW() WHERE id = $${values.length + 1}`,
      [...values, id]
    );
    return this.findEbookById(id);
  }

  async deleteEbook(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM ebooks WHERE id = $1', [id]);
    if (res.rowCount === 0) return false;
    await pool.query('DELETE FROM coupons WHERE ebook_id = $1', [id]);
    return true;
  }

  private async enrichEbook(
    book: Ebook,
    coupons?: Coupon[],
    ebookMap?: Map<string, Ebook>
  ): Promise<Ebook> {
    const allCoupons = coupons ?? (await this.loadAllCoupons());
    const map = ebookMap ?? (await this.loadEbookMap());
    const now = new Date().toISOString();

    let bonusEbook: Ebook['bonusEbook'] = undefined;
    if (book.hasBonus && book.bonusType === 'existing' && book.bonusEbookId) {
      const existing = map.get(book.bonusEbookId);
      if (existing) {
        bonusEbook = {
          id: existing.id,
          title: existing.title,
          slug: existing.slug,
          coverImageUrl: existing.coverImageUrl,
          author: existing.author,
          price: existing.price,
          pageCount: existing.pageCount,
          fileSize: existing.fileSize,
          description: existing.description
        };
      }
    } else if (book.hasBonus && book.bonusTitle) {
      bonusEbook = {
        id: `bonus-custom-${book.id}`,
        title: book.bonusTitle,
        slug: `${book.slug}-bonus`,
        coverImageUrl: book.bonusCoverImageUrl || book.coverImageUrl,
        author: book.author,
        pageCount: book.bonusPageCount || 50,
        fileSize: book.bonusFileSize || '5.0 MB',
        description: book.bonusDescription || ''
      };
    }

    const publicationType = book.publicationType || (book.comboItems && book.comboItems.length > 0 ? 'COMBO' : 'SINGLE');

    let enrichedBonusItems: BonusItem[] | undefined = undefined;
    if (book.bonusItems && Array.isArray(book.bonusItems) && book.bonusItems.length > 0) {
      enrichedBonusItems = book.bonusItems.map((item, idx) => {
        if (item.sourceType === 'existing' && item.ebookId) {
          const linked = map.get(item.ebookId);
          if (linked) {
            return {
              ...item,
              title: item.title || linked.title,
              author: item.author || linked.author,
              description: item.description || linked.description,
              coverImageUrl: item.coverImageUrl || linked.coverImageUrl,
              pdfUrl: item.pdfUrl || linked.pdfUrl,
              pageCount: item.pageCount || linked.pageCount,
              fileSize: item.fileSize || linked.fileSize,
              price: item.price || linked.price
            };
          }
        }
        return { ...item, id: item.id || `bonus-item-${idx}-${Date.now()}` };
      });
    }

    let totalOriginalValue = book.totalOriginalValue;
    if (publicationType === 'COMBO' && book.comboItems && book.comboItems.length > 0) {
      const calculatedValue = book.comboItems.reduce((acc, item) => {
        if (item.price) return acc + item.price;
        if (item.ebookId) {
          const linked = map.get(item.ebookId);
          return acc + (linked?.price || 0);
        }
        return acc + 399;
      }, 0);
      totalOriginalValue = calculatedValue > 0 ? calculatedValue : book.price * 1.5;
    }

    const activeCoupons = allCoupons.filter(
      c => c.ebookId === book.id && c.isActive && (!c.expiresAt || c.expiresAt > now)
    );

    const hasBonus = Boolean(
      book.hasBonus || (enrichedBonusItems && enrichedBonusItems.length > 0) || bonusEbook
    );

    return {
      ...book,
      hasBonus,
      bonusItems: enrichedBonusItems || book.bonusItems,
      publicationType,
      totalOriginalValue,
      bonusEbook,
      coupons: activeCoupons,
      activeCoupon: activeCoupons[0]
    };
  }

  // --- CATEGORY METHODS ---

  private async categoryBookCounts(): Promise<Map<string, number>> {
    const res = await pool.query('SELECT category, COUNT(*)::int AS cnt FROM ebooks GROUP BY category');
    const map = new Map<string, number>();
    for (const r of res.rows) map.set(r.category, Number(r.cnt));
    return map;
  }

  async getAllCategories(options: { activeOnly?: boolean; search?: string } = {}): Promise<Category[]> {
    let sql = 'SELECT * FROM categories WHERE 1 = 1';
    const params: any[] = [];
    if (options.activeOnly) sql += ' AND is_active = TRUE';
    if (options.search && options.search.trim()) {
      params.push(`%${options.search.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(COALESCE(description, '')) LIKE $${params.length})`;
    }
    const res = await pool.query(sql, params);
    const counts = await this.categoryBookCounts();
    return res.rows.map(r => {
      const c = mapCategory(r);
      return { ...c, ebookCount: counts.get(c.name) || 0 };
    });
  }

  async findCategoryById(id: string): Promise<Category | null> {
    const res = await pool.query('SELECT * FROM categories WHERE id = $1 OR slug = $1', [id]);
    if (res.rows.length === 0) return null;
    const c = mapCategory(res.rows[0]);
    const counts = await this.categoryBookCounts();
    return { ...c, ebookCount: counts.get(c.name) || 0 };
  }

  async findCategoryBySlug(slug: string): Promise<Category | null> {
    const res = await pool.query('SELECT * FROM categories WHERE slug = $1', [slug]);
    if (res.rows.length === 0) return null;
    const c = mapCategory(res.rows[0]);
    const counts = await this.categoryBookCounts();
    return { ...c, ebookCount: counts.get(c.name) || 0 };
  }

  async createCategory(data: { name: string; description?: string; isActive?: boolean }): Promise<Category> {
    const name = data.name.trim();
    const existing = await pool.query('SELECT id FROM categories WHERE LOWER(name) = $1', [name.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new Error(`A category named "${name}" already exists.`);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `category-${Date.now()}`;
    const id = genId('cat');
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO categories (id, name, slug, description, is_active, ebook_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7)`,
      [id, name, slug, data.description?.trim() || '', data.isActive !== undefined ? Boolean(data.isActive) : true, now, now]
    );
    return (await this.findCategoryById(id))!;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const cur = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (cur.rows.length === 0) return null;
    const oldName = cur.rows[0].name;

    const set: Record<string, any> = { ...updates };
    if (updates.name && updates.name.trim()) {
      const formattedName = updates.name.trim();
      const dup = await pool.query('SELECT id FROM categories WHERE id != $1 AND LOWER(name) = $2', [id, formattedName.toLowerCase()]);
      if (dup.rows.length > 0) {
        throw new Error(`A category named "${formattedName}" already exists.`);
      }
      set.name = formattedName;
      set.slug = formattedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (oldName !== formattedName) {
        await pool.query('UPDATE ebooks SET category = $1 WHERE category = $2', [formattedName, oldName]);
      }
    }

    const { clause, values } = buildUpdate(set, CAT_COLS);
    if (clause) {
      await pool.query(
        `UPDATE categories SET ${clause}, updated_at = NOW() WHERE id = $${values.length + 1}`,
        [...values, id]
      );
    }
    return this.findCategoryById(id);
  }

  async deleteCategory(id: string, force = false): Promise<{ success: boolean; message?: string }> {
    const cur = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (cur.rows.length === 0) return { success: false, message: 'Category not found' };
    const cat = mapCategory(cur.rows[0]);
    const attached = await pool.query('SELECT id FROM ebooks WHERE category = $1', [cat.name]);
    if (attached.rows.length > 0 && !force) {
      throw new Error(`Cannot delete category "${cat.name}". It is currently assigned to ${attached.rows.length} publication(s). Reassign or delete those publications first, or disable the category.`);
    }
    if (attached.rows.length > 0 && force) {
      await pool.query("UPDATE ebooks SET category = 'General' WHERE category = $1", [cat.name]);
    }
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    return { success: true };
  }

  async toggleCategoryActive(id: string): Promise<Category | null> {
    const cur = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (cur.rows.length === 0) return null;
    await pool.query(
      'UPDATE categories SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1',
      [id]
    );
    return this.findCategoryById(id);
  }

  // --- COUPON METHODS ---

  async getAllCoupons(options: { ebookId?: string; activeOnly?: boolean; search?: string } = {}): Promise<Coupon[]> {
    const params: any[] = [];
    let sql = 'SELECT * FROM coupons WHERE 1 = 1';
    if (options.ebookId) {
      params.push(options.ebookId);
      sql += ` AND ebook_id = $${params.length}`;
    }
    if (options.activeOnly) {
      sql += " AND is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())";
    }
    if (options.search && options.search.trim()) {
      params.push(`%${options.search.toUpperCase().trim()}%`);
      sql += ` AND UPPER(code) LIKE $${params.length}`;
    }
    const res = await pool.query(sql, params);
    const out: Coupon[] = [];
    for (const r of res.rows) out.push(await this.enrichCoupon(mapCoupon(r)));
    return out;
  }

  async findCouponById(id: string): Promise<Coupon | null> {
    const res = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.enrichCoupon(mapCoupon(res.rows[0]));
  }

  async findCouponByCode(code: string): Promise<Coupon | null> {
    const formatted = code.toUpperCase().trim();
    const res = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = $1', [formatted]);
    if (res.rows.length === 0) return null;
    return this.enrichCoupon(mapCoupon(res.rows[0]));
  }

  async getCouponsByEbookId(ebookId: string): Promise<Coupon[]> {
    const res = await pool.query('SELECT * FROM coupons WHERE ebook_id = $1', [ebookId]);
    const out: Coupon[] = [];
    for (const r of res.rows) out.push(await this.enrichCoupon(mapCoupon(r)));
    return out;
  }

  async createCoupon(data: {
    code: string;
    ebookId: string;
    discountPercentage: number;
    expiresAt: string;
    usageLimit?: number;
    unlimitedUsage?: boolean;
    isActive?: boolean;
  }): Promise<Coupon> {
    const code = data.code.toUpperCase().trim();
    const dup = await pool.query('SELECT id FROM coupons WHERE UPPER(code) = $1', [code]);
    if (dup.rows.length > 0) {
      throw new Error(`A coupon with code "${code}" already exists.`);
    }
    const discountPercentage = Math.min(100, Math.max(1, Number(data.discountPercentage)));
    const unlimitedUsage = Boolean(data.unlimitedUsage);
    const usageLimit = unlimitedUsage ? 0 : Math.max(1, Number(data.usageLimit) || 100);
    const id = genId('cpn');
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO coupons (id, code, ebook_id, discount_percentage, expires_at, usage_limit, usage_count, unlimited_usage, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10)`,
      [id, code, data.ebookId, discountPercentage, data.expiresAt, usageLimit, unlimitedUsage, data.isActive !== undefined ? Boolean(data.isActive) : true, now, now]
    );
    return (await this.findCouponById(id))!;
  }

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon | null> {
    const cur = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (cur.rows.length === 0) return null;

    const set: Record<string, any> = { ...updates };
    if (updates.code) {
      const formattedCode = updates.code.toUpperCase().trim();
      const dup = await pool.query('SELECT id FROM coupons WHERE id != $1 AND UPPER(code) = $2', [id, formattedCode]);
      if (dup.rows.length > 0) {
        throw new Error(`A coupon with code "${formattedCode}" already exists.`);
      }
      set.code = formattedCode;
    }
    if (updates.discountPercentage !== undefined) {
      set.discountPercentage = Math.min(100, Math.max(1, Number(updates.discountPercentage)));
    }
    if (updates.unlimitedUsage !== undefined) {
      set.unlimitedUsage = Boolean(updates.unlimitedUsage);
      if (set.unlimitedUsage) set.usageLimit = 0;
    }

    const { clause, values } = buildUpdate(set, COUPON_COLS);
    if (clause) {
      await pool.query(
        `UPDATE coupons SET ${clause}, updated_at = NOW() WHERE id = $${values.length + 1}`,
        [...values, id]
      );
    }
    return this.findCouponById(id);
  }

  async deleteCoupon(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }

  async validateCouponForEbook(
    code: string,
    ebookId: string,
    userId?: string
  ): Promise<{
    valid: boolean;
    errorType?: 'INVALID' | 'EXPIRED' | 'LIMIT_REACHED' | 'WRONG_EBOOK' | 'DISABLED' | 'ALREADY_USED';
    message: string;
    coupon?: Coupon;
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    currency: string;
  }> {
    const ebookRes = await pool.query('SELECT price, currency FROM ebooks WHERE id = $1', [ebookId]);
    const originalPrice = ebookRes.rows.length > 0 ? Number(ebookRes.rows[0].price) : 0;
    const currency = ebookRes.rows.length > 0 ? ebookRes.rows[0].currency : 'INR';

    if (!code || !code.trim()) {
      return { valid: false, errorType: 'INVALID', message: 'Please enter a coupon code.', originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }

    const formattedCode = code.toUpperCase().trim();
    const couponRes = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = $1', [formattedCode]);
    if (couponRes.rows.length === 0) {
      return { valid: false, errorType: 'INVALID', message: 'Invalid coupon code.', originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    const coupon = mapCoupon(couponRes.rows[0]);

    if (coupon.ebookId !== ebookId) {
      return { valid: false, errorType: 'WRONG_EBOOK', message: 'This coupon is not valid for this ebook.', originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (!coupon.isActive) {
      return { valid: false, errorType: 'DISABLED', message: 'This coupon is currently unavailable.', originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { valid: false, errorType: 'EXPIRED', message: 'This coupon has expired.', originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (!coupon.unlimitedUsage && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, errorType: 'LIMIT_REACHED', message: 'This coupon has reached its usage limit.', originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (userId) {
      const used = await pool.query('SELECT id FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2', [coupon.id, userId]);
      if (used.rows.length > 0) {
        return { valid: false, errorType: 'ALREADY_USED', message: 'You have already used this coupon.', originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
      }
    }

    const originalPaise = Math.round(originalPrice * 100);
    const discountPaise = Math.round((originalPaise * coupon.discountPercentage) / 100);
    const finalPaise = Math.max(0, originalPaise - discountPaise);
    const discountAmount = Number((discountPaise / 100).toFixed(2));
    const finalPrice = Number((finalPaise / 100).toFixed(2));

    return {
      valid: true,
      message: 'Coupon applied successfully.',
      coupon: await this.enrichCoupon(coupon),
      originalPrice,
      discountAmount,
      finalPrice,
      currency
    };
  }

  async recordCouponUsage(couponId: string, userId: string, purchaseId: string): Promise<void> {
    await pool.query('UPDATE coupons SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1', [couponId]);
    await pool.query(
      `INSERT INTO coupon_usages (id, coupon_id, user_id, purchase_id, used_at) VALUES ($1, $2, $3, $4, NOW())`,
      [genId('usg'), couponId, userId, purchaseId]
    );
  }

  private async enrichCoupon(coupon: Coupon): Promise<Coupon> {
    const ebookRes = await pool.query('SELECT id, title, slug, price, currency FROM ebooks WHERE id = $1', [coupon.ebookId]);
    const purchasesRes = await pool.query(
      "SELECT amount, discount_amount FROM purchases WHERE coupon_id = $1 AND payment_status = 'SUCCESS'",
      [coupon.id]
    );
    let totalRevenueGenerated = 0;
    let totalDiscountGiven = 0;
    for (const r of purchasesRes.rows) {
      totalRevenueGenerated += Number(r.amount);
      totalDiscountGiven += Number(r.discount_amount || 0);
    }
    return {
      ...coupon,
      ebook: ebookRes.rows.length > 0 ? {
        id: ebookRes.rows[0].id,
        title: ebookRes.rows[0].title,
        slug: ebookRes.rows[0].slug,
        price: Number(ebookRes.rows[0].price),
        currency: ebookRes.rows[0].currency
      } : undefined,
      totalRevenueGenerated: Number(totalRevenueGenerated.toFixed(2)),
      totalDiscountGiven: Number(totalDiscountGiven.toFixed(2))
    };
  }

  // --- PURCHASE METHODS ---

  private async loadUserMap(): Promise<Map<string, User>> {
    const res = await pool.query('SELECT * FROM users');
    const map = new Map<string, User>();
    for (const r of res.rows) map.set(r.id, mapUser(r));
    return map;
  }

  async findPurchaseByUserAndEbook(userId: string, ebookId: string): Promise<Purchase | null> {
    const res = await pool.query(
      "SELECT * FROM purchases WHERE user_id = $1 AND ebook_id = $2 AND payment_status = 'SUCCESS'",
      [userId, ebookId]
    );
    if (res.rows.length === 0) return null;
    return this.enrichPurchase(mapPurchase(res.rows[0]));
  }

  async findPurchaseByOrderId(orderId: string): Promise<Purchase | null> {
    const res = await pool.query('SELECT * FROM purchases WHERE razorpay_order_id = $1', [orderId]);
    if (res.rows.length === 0) return null;
    return this.enrichPurchase(mapPurchase(res.rows[0]));
  }

  async findPurchaseById(id: string): Promise<Purchase | null> {
    const res = await pool.query('SELECT * FROM purchases WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return this.enrichPurchase(mapPurchase(res.rows[0]));
  }

  async createPurchaseOrder(data: {
    userId: string;
    ebookId: string;
    amount: number;
    originalAmount?: number;
    discountAmount?: number;
    currency: string;
    razorpayOrderId: string;
    couponId?: string;
    couponCodeSnapshot?: string;
  }): Promise<Purchase> {
    const ebook = await this.findEbookById(data.ebookId);

    const publicationType = ebook?.publicationType || (ebook?.comboItems && ebook.comboItems.length > 0 ? 'COMBO' : 'SINGLE');
    const comboItemsSnapshot = ebook?.comboItems ? JSON.parse(JSON.stringify(ebook.comboItems)) : undefined;
    const bonusItemsSnapshot = ebook?.bonusItems ? JSON.parse(JSON.stringify(ebook.bonusItems)) : undefined;

    const hasBonus = Boolean(ebook?.hasBonus || (ebook?.bonusItems && ebook.bonusItems.length > 0));
    let bonusTitle: string | undefined = undefined;
    let bonusCoverImageUrl: string | undefined = undefined;
    let bonusEbookId: string | undefined = undefined;

    if (hasBonus && ebook) {
      if (ebook.bonusType === 'existing' && ebook.bonusEbookId) {
        const bonusBook = await this.findEbookById(ebook.bonusEbookId);
        bonusEbookId = ebook.bonusEbookId;
        bonusTitle = bonusBook?.title || ebook.bonusTitle;
        bonusCoverImageUrl = bonusBook?.coverImageUrl;
      } else {
        bonusTitle = ebook.bonusTitle;
        bonusCoverImageUrl = ebook.bonusCoverImageUrl;
      }
    }

    const id = genId('pur');
    const now = new Date().toISOString();
    await pool.query(
      `INSERT INTO purchases (
        id, user_id, ebook_id, amount, original_amount, discount_amount, final_amount, currency,
        razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_status, purchased_at,
        download_count, last_downloaded_at, publication_type, combo_items_snapshot, entitlements,
        bonus_items_snapshot, coupon_id, coupon_code_snapshot, has_bonus, bonus_ebook_id,
        bonus_title, bonus_cover_image_url, bonus_download_count, bonus_last_downloaded_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',$12,0,NULL,$13,$14,NULL,$15,$16,$17,$18,$19,$20,$21,0,NULL
      )`,
      [
        id, data.userId, data.ebookId, data.amount, data.originalAmount ?? data.amount, data.discountAmount ?? 0,
        data.amount, data.currency, data.razorpayOrderId, null, null, now, publicationType, jsonVal(comboItemsSnapshot),
        jsonVal(bonusItemsSnapshot), data.couponId ?? null, data.couponCodeSnapshot ?? null, hasBonus,
        bonusEbookId ?? null, bonusTitle ?? null, bonusCoverImageUrl ?? null, 0
      ]
    );
    return (await this.findPurchaseById(id))!;
  }

  async verifyAndCompletePurchase(orderId: string, paymentId: string, signature: string): Promise<Purchase | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query('SELECT * FROM purchases WHERE razorpay_order_id = $1', [orderId]);
      if (res.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }
      const purchase = mapPurchase(res.rows[0]);
      await client.query(
        `UPDATE purchases SET payment_status = 'SUCCESS', razorpay_payment_id = $1, razorpay_signature = $2, purchased_at = NOW() WHERE id = $3`,
        [paymentId, signature, purchase.id]
      );
      await client.query('UPDATE ebooks SET download_count = COALESCE(download_count, 0) + 1 WHERE id = $1', [purchase.ebookId]);
      if (purchase.couponId) {
        await client.query('UPDATE coupons SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1', [purchase.couponId]);
        await client.query(
          `INSERT INTO coupon_usages (id, coupon_id, user_id, purchase_id, used_at) VALUES ($1, $2, $3, $4, NOW())`,
          [genId('usg'), purchase.couponId, purchase.userId, purchase.id]
        );
      }
      await client.query('COMMIT');
      return this.findPurchaseById(purchase.id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async markPurchaseFailed(orderId: string): Promise<void> {
    await pool.query("UPDATE purchases SET payment_status = 'FAILED' WHERE razorpay_order_id = $1", [orderId]);
  }

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    const res = await pool.query(
      "SELECT * FROM purchases WHERE user_id = $1 AND payment_status = 'SUCCESS' ORDER BY purchased_at DESC",
      [userId]
    );
    const ebookMap = await this.loadEbookMap();
    const userMap = await this.loadUserMap();
    const out: Purchase[] = [];
    for (const r of res.rows) out.push(await this.enrichPurchase(mapPurchase(r), ebookMap, userMap));
    return out;
  }

  async getAllPurchases(options: { status?: string; search?: string } = {}): Promise<Purchase[]> {
    const params: any[] = [];
    let sql = `SELECT p.* FROM purchases p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN ebooks e ON e.id = p.ebook_id
      WHERE 1 = 1`;
    if (options.status && options.status !== 'all') {
      params.push(options.status);
      sql += ` AND p.payment_status = $${params.length}`;
    }
    if (options.search && options.search.trim()) {
      const q = `%${options.search.toLowerCase().trim()}%`;
      params.push(q, q, q, q, q, q, q);
      sql += ` AND (
        LOWER(u.name) LIKE $${params.length - 6} OR
        LOWER(u.email) LIKE $${params.length - 5} OR
        LOWER(e.title) LIKE $${params.length - 4} OR
        LOWER(COALESCE(p.bonus_title, '')) LIKE $${params.length - 3} OR
        LOWER(COALESCE(p.coupon_code_snapshot, '')) LIKE $${params.length - 2} OR
        LOWER(p.razorpay_order_id) LIKE $${params.length - 1} OR
        LOWER(COALESCE(p.razorpay_payment_id, '')) LIKE $${params.length}
      )`;
    }
    sql += ' ORDER BY p.purchased_at DESC';
    const res = await pool.query(sql, params);
    const ebookMap = await this.loadEbookMap();
    const userMap = await this.loadUserMap();
    const out: Purchase[] = [];
    for (const r of res.rows) out.push(await this.enrichPurchase(mapPurchase(r), ebookMap, userMap));
    return out;
  }

  async incrementDownloadCount(purchaseId: string): Promise<void> {
    await pool.query(
      'UPDATE purchases SET download_count = COALESCE(download_count, 0) + 1, last_downloaded_at = NOW() WHERE id = $1',
      [purchaseId]
    );
  }

  async incrementBonusDownloadCount(purchaseId: string): Promise<void> {
    await pool.query(
      'UPDATE purchases SET bonus_download_count = COALESCE(bonus_download_count, 0) + 1, bonus_last_downloaded_at = NOW() WHERE id = $1',
      [purchaseId]
    );
  }

  // --- ANALYTICS DASHBOARD ---

  async getDashboardStats(): Promise<DashboardStats> {
    const purchasesRes = await pool.query(
      "SELECT * FROM purchases WHERE payment_status = 'SUCCESS' ORDER BY purchased_at DESC"
    );
    const ebookMap = await this.loadEbookMap();
    const userMap = await this.loadUserMap();
    const successfulPurchases = purchasesRes.rows.map(r => r);

    const totalEarnings = successfulPurchases.reduce((acc, r) => acc + Number(r.amount), 0);
    const today = new Date().toISOString().split('T')[0];
    const todayPurchases = successfulPurchases.filter(r => String(r.purchased_at).startsWith(today));
    const todayEarnings = todayPurchases.reduce((acc, r) => acc + Number(r.amount), 0);

    const totalPurchases = successfulPurchases.length;
    const usersCount = (await pool.query('SELECT COUNT(*)::int AS c FROM users')).rows[0].c;
    const ebooksCount = (await pool.query('SELECT COUNT(*)::int AS c FROM ebooks')).rows[0].c;

    const now = new Date().toISOString();
    const activeCoupons = (await pool.query(
      "SELECT COUNT(*)::int AS c FROM coupons WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > $1)",
      [now]
    )).rows[0].c;
    const totalCouponUses = (await pool.query('SELECT COUNT(*)::int AS c FROM coupon_usages')).rows[0].c;
    const totalDiscountsGiven = successfulPurchases.reduce((acc, r) => acc + Number(r.discount_amount || 0), 0);

    const recentPurchases: Purchase[] = [];
    for (const r of successfulPurchases.slice(0, 10)) {
      recentPurchases.push(await this.enrichPurchase(mapPurchase(r), ebookMap, userMap));
    }

    const salesMap: Record<string, { count: number; revenue: number }> = {};
    for (const r of successfulPurchases) {
      if (!salesMap[r.ebook_id]) salesMap[r.ebook_id] = { count: 0, revenue: 0 };
      salesMap[r.ebook_id].count += 1;
      salesMap[r.ebook_id].revenue += Number(r.amount);
    }
    const topSellingEbooks = Object.entries(salesMap)
      .map(([ebookId, stats]) => {
        const ebook = ebookMap.get(ebookId);
        return ebook ? { ebook: ebook, salesCount: stats.count, revenue: Number(stats.revenue.toFixed(2)) } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 5);

    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const revenueByMonth = months.map((m, monthIndex) => {
      const salesInMonth = successfulPurchases.filter(p => new Date(p.purchased_at).getMonth() === monthIndex + 2);
      const rev = salesInMonth.reduce((acc, c) => acc + Number(c.amount), 0);
      return {
        month: m,
        revenue: rev > 0 ? Number(rev.toFixed(2)) : Math.floor(totalEarnings * (0.1 + monthIndex * 0.05)),
        sales: salesInMonth.length > 0 ? salesInMonth.length : (monthIndex + 1) * 2
      };
    });

    return {
      totalEarnings: Number(totalEarnings.toFixed(2)),
      todayEarnings: Number(todayEarnings.toFixed(2)),
      totalPurchases,
      totalUsers: usersCount,
      totalEbooks: ebooksCount,
      activeCoupons,
      totalCouponUses,
      totalDiscountsGiven: Number(totalDiscountsGiven.toFixed(2)),
      recentPurchases,
      topSellingEbooks,
      revenueByMonth
    };
  }

  async hasUserAccessToEbook(userId: string, targetId: string): Promise<{
    hasAccess: boolean;
    purchase?: Purchase;
    entitlementType?: 'PURCHASED' | 'COMBO_INCLUDED' | 'BONUS';
    itemDetails?: {
      title: string;
      author: string;
      coverImageUrl: string;
      pdfUrl?: string;
      pageCount?: number;
      fileSize?: string;
    };
  }> {
    const res = await pool.query(
      "SELECT * FROM purchases WHERE user_id = $1 AND payment_status = 'SUCCESS'",
      [userId]
    );
    const ebookMap = await this.loadEbookMap();
    const userMap = await this.loadUserMap();

    for (const r of res.rows) {
      const purchase = await this.enrichPurchase(mapPurchase(r), ebookMap, userMap);
      const ebook = ebookMap.get(purchase.ebookId);

      if (purchase.ebookId === targetId) {
        return {
          hasAccess: true,
          purchase,
          entitlementType: 'PURCHASED',
          itemDetails: ebook ? {
            title: ebook.title,
            author: ebook.author,
            coverImageUrl: ebook.coverImageUrl,
            pdfUrl: ebook.pdfUrl,
            pageCount: ebook.pageCount,
            fileSize: ebook.fileSize
          } : undefined
        };
      }

      const comboItems = purchase.comboItemsSnapshot || ebook?.comboItems || [];
      const matchingComboItem = comboItems.find(
        ci => ci.id === targetId || (ci.ebookId && ci.ebookId === targetId)
      );
      if (matchingComboItem) {
        return {
          hasAccess: true,
          purchase,
          entitlementType: 'COMBO_INCLUDED',
          itemDetails: {
            title: matchingComboItem.title,
            author: matchingComboItem.author,
            coverImageUrl: matchingComboItem.coverImageUrl || ebook?.coverImageUrl || '',
            pdfUrl: matchingComboItem.pdfUrl,
            pageCount: matchingComboItem.pageCount || 200,
            fileSize: matchingComboItem.fileSize || '10 MB'
          }
        };
      }

      const bonusItems = purchase.bonusItemsSnapshot || ebook?.bonusItems || [];
      const matchingBonusItem = bonusItems.find(
        bi => bi.id === targetId || (bi.ebookId && bi.ebookId === targetId)
      );
      if (matchingBonusItem) {
        return {
          hasAccess: true,
          purchase,
          entitlementType: 'BONUS',
          itemDetails: {
            title: matchingBonusItem.title,
            author: matchingBonusItem.author || ebook?.author || 'Editorial Author',
            coverImageUrl: matchingBonusItem.coverImageUrl || ebook?.coverImageUrl || '',
            pdfUrl: matchingBonusItem.pdfUrl,
            pageCount: matchingBonusItem.pageCount || 50,
            fileSize: matchingBonusItem.fileSize || '5 MB'
          }
        };
      }

      if (purchase.hasBonus || ebook?.hasBonus) {
        if (
          purchase.bonusEbookId === targetId ||
          `bonus-${purchase.id}` === targetId ||
          `bonus-custom-${purchase.ebookId}` === targetId ||
          targetId === 'bonus'
        ) {
          return {
            hasAccess: true,
            purchase,
            entitlementType: 'BONUS',
            itemDetails: {
              title: purchase.bonusTitle || ebook?.bonusTitle || 'Bonus Companion',
              author: ebook?.author || 'Editorial Author',
              coverImageUrl: purchase.bonusCoverImageUrl || ebook?.bonusCoverImageUrl || ebook?.coverImageUrl || '',
              pdfUrl: ebook?.bonusPdfUrl,
              pageCount: ebook?.bonusPageCount || 50,
              fileSize: ebook?.bonusFileSize || '5 MB'
            }
          };
        }
      }
    }

    return { hasAccess: false };
  }

  private async enrichPurchase(
    purchase: Purchase,
    ebookMap?: Map<string, Ebook>,
    userMap?: Map<string, User>
  ): Promise<Purchase> {
    const ebook = ebookMap?.get(purchase.ebookId) ?? (await this.findEbookById(purchase.ebookId));
    const user = userMap?.get(purchase.userId) ?? (await this.findUserById(purchase.userId));

    const publicationType = purchase.publicationType || ebook?.publicationType || (ebook?.comboItems && ebook.comboItems.length > 0 ? 'COMBO' : 'SINGLE');
    const comboItems = purchase.comboItemsSnapshot || ebook?.comboItems || [];
    const bonusItems = purchase.bonusItemsSnapshot || ebook?.bonusItems || [];

    const entitlements: AccessEntitlement[] = [];

    if (publicationType === 'COMBO' && comboItems.length > 0) {
      comboItems.forEach(ci => {
        entitlements.push({
          id: `ent-${purchase.id}-${ci.id}`,
          itemId: ci.id,
          title: ci.title,
          author: ci.author,
          description: ci.description,
          coverImageUrl: ci.coverImageUrl || ebook?.coverImageUrl || '',
          pdfUrl: ci.pdfUrl,
          pageCount: ci.pageCount,
          fileSize: ci.fileSize,
          type: 'COMBO_INCLUDED',
          parentEbookId: purchase.ebookId,
          parentTitle: ebook?.title || 'Combo Package',
          downloadUrl: `/api/ebooks/${purchase.ebookId}/download?comboItemId=${ci.id}`
        });
      });
    } else if (ebook) {
      entitlements.push({
        id: `ent-${purchase.id}-${ebook.id}`,
        itemId: ebook.id,
        title: ebook.title,
        author: ebook.author,
        description: ebook.description,
        coverImageUrl: ebook.coverImageUrl,
        pdfUrl: ebook.pdfUrl,
        pageCount: ebook.pageCount,
        fileSize: ebook.fileSize,
        type: 'PURCHASED',
        parentEbookId: ebook.id,
        parentTitle: ebook.title,
        downloadUrl: `/api/ebooks/${ebook.id}/download`
      });
    }

    if (bonusItems.length > 0) {
      bonusItems.forEach((bi, bIdx) => {
        entitlements.push({
          id: `ent-${purchase.id}-bonus-${bi.id || bIdx}`,
          itemId: bi.id || `bonus-${bIdx}`,
          title: bi.title || 'Bonus Companion Guide',
          author: bi.author || ebook?.author || 'Editorial Author',
          description: bi.description || 'Free companion edition included with this purchase.',
          coverImageUrl: bi.coverImageUrl || ebook?.coverImageUrl || '',
          pdfUrl: bi.pdfUrl,
          pageCount: bi.pageCount || 50,
          fileSize: bi.fileSize || '4.5 MB',
          type: 'BONUS',
          parentEbookId: purchase.ebookId,
          parentTitle: ebook?.title || 'Main Publication',
          downloadUrl: `/api/ebooks/${purchase.ebookId}/download?bonusItemId=${bi.id || bIdx}&type=bonus`
        });
      });
    } else if (purchase.hasBonus || ebook?.hasBonus) {
      const bonusTitle = purchase.bonusTitle || ebook?.bonusTitle || 'Bonus Companion Guide';
      const bonusCover = purchase.bonusCoverImageUrl || ebook?.bonusCoverImageUrl || ebook?.coverImageUrl || '';
      entitlements.push({
        id: `ent-${purchase.id}-bonus`,
        itemId: `bonus-${purchase.id}`,
        title: bonusTitle,
        author: ebook?.author || 'Editorial Author',
        description: ebook?.bonusDescription || 'Free companion edition included with this purchase.',
        coverImageUrl: bonusCover,
        pdfUrl: ebook?.bonusPdfUrl,
        pageCount: ebook?.bonusPageCount || 50,
        fileSize: ebook?.bonusFileSize || '4.5 MB',
        type: 'BONUS',
        parentEbookId: purchase.ebookId,
        parentTitle: ebook?.title || 'Main Publication',
        downloadUrl: `/api/ebooks/${purchase.ebookId}/download?type=bonus`
      });
    }

    return {
      ...purchase,
      publicationType,
      comboItemsSnapshot: comboItems as ComboItem[],
      bonusItemsSnapshot: bonusItems as BonusItem[],
      entitlements,
      user: user ? { name: user.name, email: user.email } : undefined,
      ebook: ebook ? {
        title: ebook.title,
        slug: ebook.slug,
        coverImageUrl: ebook.coverImageUrl,
        author: ebook.author,
        publicationType,
        comboItems,
        hasBonus: Boolean(ebook.hasBonus || bonusItems.length > 0),
        bonusTitle: ebook.bonusTitle,
        bonusCoverImageUrl: ebook.bonusCoverImageUrl,
        bonusItems
      } : undefined
    };
  }
}

export const db = new Database();


