var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_express8 = __toESM(require("express"), 1);
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
var import_dotenv2 = __toESM(require("dotenv"), 1);

// server/routes/auth.ts
var import_express = require("express");

// server/db.ts
var import_pg = require("pg");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[db] DATABASE_URL is not set. PostgreSQL-backed store requires it.");
}
var ssl = DATABASE_URL && (DATABASE_URL.includes("sslmode=require") || DATABASE_URL.includes("neon.tech")) ? { rejectUnauthorized: false } : void 0;
var pool = new import_pg.Pool({
  connectionString: DATABASE_URL,
  ssl,
  max: 10
});
function iso(v) {
  if (v == null) return void 0;
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return void 0;
  return d.toISOString();
}
function num(v) {
  if (v == null) return void 0;
  const n = typeof v === "number" ? v : Number(v);
  return isNaN(n) ? void 0 : n;
}
function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
function jsonVal(v) {
  return v == null ? null : JSON.stringify(v);
}
function mapUser(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    lastLoginAt: iso(r.last_login_at),
    isActive: r.is_active
  };
}
function mapUserWithHash(r) {
  return { ...mapUser(r), passwordHash: r.password_hash };
}
function mapCategory(r) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    isActive: r.is_active,
    ebookCount: Number(r.ebook_count ?? 0),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at)
  };
}
function mapEbook(r) {
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
    coverPublicId: r.cover_public_id ?? void 0,
    pdfUrl: r.pdf_url,
    pdfPublicId: r.pdf_public_id ?? void 0,
    cloudinaryResourceType: r.cloudinary_resource_type ?? void 0,
    fileSize: r.file_size,
    pageCount: Number(r.page_count),
    featured: r.featured,
    published: r.published,
    downloadCount: Number(r.download_count ?? 0),
    sampleChapter: r.sample_chapter ?? void 0,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    publicationType: r.publication_type ?? void 0,
    comboItems: r.combo_items ?? void 0,
    totalOriginalValue: num(r.total_original_value),
    hasBonus: r.has_bonus ?? void 0,
    bonusItems: r.bonus_items ?? void 0,
    bonusType: r.bonus_type ?? void 0,
    bonusEbookId: r.bonus_ebook_id ?? void 0,
    bonusTitle: r.bonus_title ?? void 0,
    bonusDescription: r.bonus_description ?? void 0,
    bonusCoverImageUrl: r.bonus_cover_image_url ?? void 0,
    bonusPdfUrl: r.bonus_pdf_url ?? void 0,
    bonusPageCount: num(r.bonus_page_count),
    bonusFileSize: r.bonus_file_size ?? void 0
  };
}
function mapCoupon(r) {
  return {
    id: r.id,
    code: r.code,
    ebookId: r.ebook_id,
    discountPercentage: Number(r.discount_percentage),
    expiresAt: iso(r.expires_at),
    usageLimit: Number(r.usage_limit),
    usageCount: Number(r.usage_count),
    unlimitedUsage: r.unlimited_usage,
    isActive: r.is_active,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at)
  };
}
function mapPurchase(r) {
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
    razorpayPaymentId: r.razorpay_payment_id ?? void 0,
    razorpaySignature: r.razorpay_signature ?? void 0,
    paymentStatus: r.payment_status,
    purchasedAt: iso(r.purchased_at),
    downloadCount: Number(r.download_count ?? 0),
    lastDownloadedAt: iso(r.last_downloaded_at),
    publicationType: r.publication_type ?? void 0,
    comboItemsSnapshot: r.combo_items_snapshot ?? void 0,
    entitlements: r.entitlements ?? void 0,
    couponId: r.coupon_id ?? void 0,
    couponCodeSnapshot: r.coupon_code_snapshot ?? void 0,
    hasBonus: r.has_bonus ?? void 0,
    bonusItemsSnapshot: r.bonus_items_snapshot ?? void 0,
    bonusEbookId: r.bonus_ebook_id ?? void 0,
    bonusTitle: r.bonus_title ?? void 0,
    bonusCoverImageUrl: r.bonus_cover_image_url ?? void 0,
    bonusDownloadCount: num(r.bonus_download_count),
    bonusLastDownloadedAt: iso(r.bonus_last_downloaded_at)
  };
}
var EBOOK_COLS = {
  title: "title",
  slug: "slug",
  description: "description",
  author: "author",
  category: "category",
  price: "price",
  currency: "currency",
  coverImageUrl: "cover_image_url",
  coverPublicId: "cover_public_id",
  pdfUrl: "pdf_url",
  pdfPublicId: "pdf_public_id",
  cloudinaryResourceType: "cloudinary_resource_type",
  fileSize: "file_size",
  pageCount: "page_count",
  featured: "featured",
  published: "published",
  sampleChapter: "sample_chapter",
  publicationType: "publication_type",
  comboItems: "combo_items",
  totalOriginalValue: "total_original_value",
  hasBonus: "has_bonus",
  bonusItems: "bonus_items",
  bonusType: "bonus_type",
  bonusEbookId: "bonus_ebook_id",
  bonusTitle: "bonus_title",
  bonusDescription: "bonus_description",
  bonusCoverImageUrl: "bonus_cover_image_url",
  bonusPdfUrl: "bonus_pdf_url",
  bonusPageCount: "bonus_page_count",
  bonusFileSize: "bonus_file_size"
};
var EBOOK_JSON = /* @__PURE__ */ new Set(["comboItems", "bonusItems"]);
var USER_COLS = {
  name: "name",
  email: "email",
  role: "role",
  lastLoginAt: "last_login_at",
  isActive: "is_active"
};
var CAT_COLS = {
  name: "name",
  slug: "slug",
  description: "description",
  isActive: "is_active"
};
var COUPON_COLS = {
  code: "code",
  ebookId: "ebook_id",
  discountPercentage: "discount_percentage",
  expiresAt: "expires_at",
  usageLimit: "usage_limit",
  unlimitedUsage: "unlimited_usage",
  isActive: "is_active"
};
function buildUpdate(set, colMap, jsonKeys = /* @__PURE__ */ new Set()) {
  const parts = [];
  const values = [];
  for (const [k, v] of Object.entries(set)) {
    const col = colMap[k];
    if (!col) continue;
    values.push(jsonKeys.has(k) ? v == null ? null : JSON.stringify(v) : v);
    parts.push(`${col} = $${values.length}`);
  }
  return { clause: parts.join(", "), values };
}
var Database = class {
  // --- USER METHODS ---
  async findUserByEmail(email) {
    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (res.rows.length === 0) return null;
    return mapUserWithHash(res.rows[0]);
  }
  async findUserById(id) {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return mapUser(res.rows[0]);
  }
  async findUserWithHashById(id) {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return mapUserWithHash(res.rows[0]);
  }
  async createUser(data) {
    const id = genId("usr");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const email = data.email.toLowerCase().trim();
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at, last_login_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, data.name.trim(), email, data.passwordHash, data.role || "USER", now, now, now, true]
    );
    return await this.findUserById(id);
  }
  async updateUser(id, updates) {
    const set = { ...updates };
    if (set.passwordHash) {
      const { clause, values } = buildUpdate(set, { ...USER_COLS, passwordHash: "password_hash" });
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
  async getAllUsers() {
    const usersRes = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    const purchasesRes = await pool.query(
      "SELECT user_id, amount FROM purchases WHERE payment_status = 'SUCCESS'"
    );
    const agg = {};
    for (const r of purchasesRes.rows) {
      if (!agg[r.user_id]) agg[r.user_id] = { count: 0, spent: 0 };
      agg[r.user_id].count += 1;
      agg[r.user_id].spent += Number(r.amount);
    }
    return usersRes.rows.map((u) => {
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
  async loadAllCoupons() {
    const res = await pool.query("SELECT * FROM coupons");
    return res.rows.map(mapCoupon);
  }
  async loadEbookMap() {
    const res = await pool.query("SELECT * FROM ebooks");
    const map = /* @__PURE__ */ new Map();
    for (const r of res.rows) map.set(r.id, mapEbook(r));
    return map;
  }
  async getAllEbooks(options = {}) {
    const params = [];
    let sql = "SELECT * FROM ebooks WHERE 1 = 1";
    if (options.publishedOnly) {
      sql += " AND published = TRUE";
    }
    if (options.category && options.category !== "all") {
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
    if (options.sort === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (options.sort === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (options.sort === "featured") {
      list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    const coupons = await this.loadAllCoupons();
    const ebookMap = await this.loadEbookMap();
    const out = [];
    for (const e of list) out.push(await this.enrichEbook(e, coupons, ebookMap));
    return out;
  }
  async findEbookById(id) {
    const res = await pool.query("SELECT * FROM ebooks WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return this.enrichEbook(mapEbook(res.rows[0]));
  }
  async findEbookBySlug(slug) {
    const res = await pool.query("SELECT * FROM ebooks WHERE slug = $1 OR id = $1", [slug]);
    if (res.rows.length === 0) return null;
    return this.enrichEbook(mapEbook(res.rows[0]));
  }
  async createEbook(data) {
    const id = genId("ebk");
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
        id,
        data.title,
        data.slug,
        data.description,
        data.author,
        data.category,
        data.price,
        data.currency || "INR",
        data.coverImageUrl,
        data.coverPublicId ?? null,
        data.pdfUrl,
        data.pdfPublicId ?? null,
        data.cloudinaryResourceType ?? null,
        data.fileSize,
        data.pageCount,
        data.featured ?? false,
        data.published ?? false,
        0,
        data.sampleChapter ?? null,
        now,
        now,
        data.publicationType || "SINGLE",
        jsonVal(data.comboItems),
        data.totalOriginalValue ?? null,
        data.hasBonus ?? false,
        jsonVal(data.bonusItems),
        data.bonusType || "custom",
        data.bonusEbookId ?? null,
        data.bonusTitle ?? null,
        data.bonusDescription ?? null,
        data.bonusCoverImageUrl ?? null,
        data.bonusPdfUrl ?? null,
        data.bonusPageCount ?? null,
        data.bonusFileSize ?? null
      ]
    );
    return await this.findEbookById(id);
  }
  async updateEbook(id, updates) {
    const set = { ...updates };
    const { clause, values } = buildUpdate(set, EBOOK_COLS, EBOOK_JSON);
    if (!clause) return this.findEbookById(id);
    await pool.query(
      `UPDATE ebooks SET ${clause}, updated_at = NOW() WHERE id = $${values.length + 1}`,
      [...values, id]
    );
    return this.findEbookById(id);
  }
  async deleteEbook(id) {
    const res = await pool.query("DELETE FROM ebooks WHERE id = $1", [id]);
    if (res.rowCount === 0) return false;
    await pool.query("DELETE FROM coupons WHERE ebook_id = $1", [id]);
    return true;
  }
  async enrichEbook(book, coupons, ebookMap) {
    const allCoupons = coupons ?? await this.loadAllCoupons();
    const map = ebookMap ?? await this.loadEbookMap();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let bonusEbook = void 0;
    if (book.hasBonus && book.bonusType === "existing" && book.bonusEbookId) {
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
        fileSize: book.bonusFileSize || "5.0 MB",
        description: book.bonusDescription || ""
      };
    }
    const publicationType = book.publicationType || (book.comboItems && book.comboItems.length > 0 ? "COMBO" : "SINGLE");
    let enrichedBonusItems = void 0;
    if (book.bonusItems && Array.isArray(book.bonusItems) && book.bonusItems.length > 0) {
      enrichedBonusItems = book.bonusItems.map((item, idx) => {
        if (item.sourceType === "existing" && item.ebookId) {
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
    if (publicationType === "COMBO" && book.comboItems && book.comboItems.length > 0) {
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
      (c) => c.ebookId === book.id && c.isActive && (!c.expiresAt || c.expiresAt > now)
    );
    const hasBonus = Boolean(
      book.hasBonus || enrichedBonusItems && enrichedBonusItems.length > 0 || bonusEbook
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
  async categoryBookCounts() {
    const res = await pool.query("SELECT category, COUNT(*)::int AS cnt FROM ebooks GROUP BY category");
    const map = /* @__PURE__ */ new Map();
    for (const r of res.rows) map.set(r.category, Number(r.cnt));
    return map;
  }
  async getAllCategories(options = {}) {
    let sql = "SELECT * FROM categories WHERE 1 = 1";
    const params = [];
    if (options.activeOnly) sql += " AND is_active = TRUE";
    if (options.search && options.search.trim()) {
      params.push(`%${options.search.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(COALESCE(description, '')) LIKE $${params.length})`;
    }
    const res = await pool.query(sql, params);
    const counts = await this.categoryBookCounts();
    return res.rows.map((r) => {
      const c = mapCategory(r);
      return { ...c, ebookCount: counts.get(c.name) || 0 };
    });
  }
  async findCategoryById(id) {
    const res = await pool.query("SELECT * FROM categories WHERE id = $1 OR slug = $1", [id]);
    if (res.rows.length === 0) return null;
    const c = mapCategory(res.rows[0]);
    const counts = await this.categoryBookCounts();
    return { ...c, ebookCount: counts.get(c.name) || 0 };
  }
  async findCategoryBySlug(slug) {
    const res = await pool.query("SELECT * FROM categories WHERE slug = $1", [slug]);
    if (res.rows.length === 0) return null;
    const c = mapCategory(res.rows[0]);
    const counts = await this.categoryBookCounts();
    return { ...c, ebookCount: counts.get(c.name) || 0 };
  }
  async createCategory(data) {
    const name = data.name.trim();
    const existing = await pool.query("SELECT id FROM categories WHERE LOWER(name) = $1", [name.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw new Error(`A category named "${name}" already exists.`);
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `category-${Date.now()}`;
    const id = genId("cat");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `INSERT INTO categories (id, name, slug, description, is_active, ebook_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 0, $6, $7)`,
      [id, name, slug, data.description?.trim() || "", data.isActive !== void 0 ? Boolean(data.isActive) : true, now, now]
    );
    return await this.findCategoryById(id);
  }
  async updateCategory(id, updates) {
    const cur = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
    if (cur.rows.length === 0) return null;
    const oldName = cur.rows[0].name;
    const set = { ...updates };
    if (updates.name && updates.name.trim()) {
      const formattedName = updates.name.trim();
      const dup = await pool.query("SELECT id FROM categories WHERE id != $1 AND LOWER(name) = $2", [id, formattedName.toLowerCase()]);
      if (dup.rows.length > 0) {
        throw new Error(`A category named "${formattedName}" already exists.`);
      }
      set.name = formattedName;
      set.slug = formattedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      if (oldName !== formattedName) {
        await pool.query("UPDATE ebooks SET category = $1 WHERE category = $2", [formattedName, oldName]);
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
  async deleteCategory(id, force = false) {
    const cur = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
    if (cur.rows.length === 0) return { success: false, message: "Category not found" };
    const cat = mapCategory(cur.rows[0]);
    const attached = await pool.query("SELECT id FROM ebooks WHERE category = $1", [cat.name]);
    if (attached.rows.length > 0 && !force) {
      throw new Error(`Cannot delete category "${cat.name}". It is currently assigned to ${attached.rows.length} publication(s). Reassign or delete those publications first, or disable the category.`);
    }
    if (attached.rows.length > 0 && force) {
      await pool.query("UPDATE ebooks SET category = 'General' WHERE category = $1", [cat.name]);
    }
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    return { success: true };
  }
  async toggleCategoryActive(id) {
    const cur = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
    if (cur.rows.length === 0) return null;
    await pool.query(
      "UPDATE categories SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1",
      [id]
    );
    return this.findCategoryById(id);
  }
  // --- COUPON METHODS ---
  async getAllCoupons(options = {}) {
    const params = [];
    let sql = "SELECT * FROM coupons WHERE 1 = 1";
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
    const out = [];
    for (const r of res.rows) out.push(await this.enrichCoupon(mapCoupon(r)));
    return out;
  }
  async findCouponById(id) {
    const res = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return this.enrichCoupon(mapCoupon(res.rows[0]));
  }
  async findCouponByCode(code) {
    const formatted = code.toUpperCase().trim();
    const res = await pool.query("SELECT * FROM coupons WHERE UPPER(code) = $1", [formatted]);
    if (res.rows.length === 0) return null;
    return this.enrichCoupon(mapCoupon(res.rows[0]));
  }
  async getCouponsByEbookId(ebookId) {
    const res = await pool.query("SELECT * FROM coupons WHERE ebook_id = $1", [ebookId]);
    const out = [];
    for (const r of res.rows) out.push(await this.enrichCoupon(mapCoupon(r)));
    return out;
  }
  async createCoupon(data) {
    const code = data.code.toUpperCase().trim();
    const dup = await pool.query("SELECT id FROM coupons WHERE UPPER(code) = $1", [code]);
    if (dup.rows.length > 0) {
      throw new Error(`A coupon with code "${code}" already exists.`);
    }
    const discountPercentage = Math.min(100, Math.max(1, Number(data.discountPercentage)));
    const unlimitedUsage = Boolean(data.unlimitedUsage);
    const usageLimit = unlimitedUsage ? 0 : Math.max(1, Number(data.usageLimit) || 100);
    const id = genId("cpn");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await pool.query(
      `INSERT INTO coupons (id, code, ebook_id, discount_percentage, expires_at, usage_limit, usage_count, unlimited_usage, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,$9,$10)`,
      [id, code, data.ebookId, discountPercentage, data.expiresAt, usageLimit, unlimitedUsage, data.isActive !== void 0 ? Boolean(data.isActive) : true, now, now]
    );
    return await this.findCouponById(id);
  }
  async updateCoupon(id, updates) {
    const cur = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    if (cur.rows.length === 0) return null;
    const set = { ...updates };
    if (updates.code) {
      const formattedCode = updates.code.toUpperCase().trim();
      const dup = await pool.query("SELECT id FROM coupons WHERE id != $1 AND UPPER(code) = $2", [id, formattedCode]);
      if (dup.rows.length > 0) {
        throw new Error(`A coupon with code "${formattedCode}" already exists.`);
      }
      set.code = formattedCode;
    }
    if (updates.discountPercentage !== void 0) {
      set.discountPercentage = Math.min(100, Math.max(1, Number(updates.discountPercentage)));
    }
    if (updates.unlimitedUsage !== void 0) {
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
  async deleteCoupon(id) {
    const res = await pool.query("DELETE FROM coupons WHERE id = $1", [id]);
    return res.rowCount !== null && res.rowCount > 0;
  }
  async validateCouponForEbook(code, ebookId, userId) {
    const ebookRes = await pool.query("SELECT price, currency FROM ebooks WHERE id = $1", [ebookId]);
    const originalPrice = ebookRes.rows.length > 0 ? Number(ebookRes.rows[0].price) : 0;
    const currency = ebookRes.rows.length > 0 ? ebookRes.rows[0].currency : "INR";
    if (!code || !code.trim()) {
      return { valid: false, errorType: "INVALID", message: "Please enter a coupon code.", originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    const formattedCode = code.toUpperCase().trim();
    const couponRes = await pool.query("SELECT * FROM coupons WHERE UPPER(code) = $1", [formattedCode]);
    if (couponRes.rows.length === 0) {
      return { valid: false, errorType: "INVALID", message: "Invalid coupon code.", originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    const coupon = mapCoupon(couponRes.rows[0]);
    if (coupon.ebookId !== ebookId) {
      return { valid: false, errorType: "WRONG_EBOOK", message: "This coupon is not valid for this ebook.", originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (!coupon.isActive) {
      return { valid: false, errorType: "DISABLED", message: "This coupon is currently unavailable.", originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { valid: false, errorType: "EXPIRED", message: "This coupon has expired.", originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (!coupon.unlimitedUsage && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, errorType: "LIMIT_REACHED", message: "This coupon has reached its usage limit.", originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
    }
    if (userId) {
      const used = await pool.query("SELECT id FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2", [coupon.id, userId]);
      if (used.rows.length > 0) {
        return { valid: false, errorType: "ALREADY_USED", message: "You have already used this coupon.", originalPrice, discountAmount: 0, finalPrice: originalPrice, currency };
      }
    }
    const originalPaise = Math.round(originalPrice * 100);
    const discountPaise = Math.round(originalPaise * coupon.discountPercentage / 100);
    const finalPaise = Math.max(0, originalPaise - discountPaise);
    const discountAmount = Number((discountPaise / 100).toFixed(2));
    const finalPrice = Number((finalPaise / 100).toFixed(2));
    return {
      valid: true,
      message: "Coupon applied successfully.",
      coupon: await this.enrichCoupon(coupon),
      originalPrice,
      discountAmount,
      finalPrice,
      currency
    };
  }
  async recordCouponUsage(couponId, userId, purchaseId) {
    await pool.query("UPDATE coupons SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1", [couponId]);
    await pool.query(
      `INSERT INTO coupon_usages (id, coupon_id, user_id, purchase_id, used_at) VALUES ($1, $2, $3, $4, NOW())`,
      [genId("usg"), couponId, userId, purchaseId]
    );
  }
  async enrichCoupon(coupon) {
    const ebookRes = await pool.query("SELECT id, title, slug, price, currency FROM ebooks WHERE id = $1", [coupon.ebookId]);
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
      } : void 0,
      totalRevenueGenerated: Number(totalRevenueGenerated.toFixed(2)),
      totalDiscountGiven: Number(totalDiscountGiven.toFixed(2))
    };
  }
  // --- PURCHASE METHODS ---
  async loadUserMap() {
    const res = await pool.query("SELECT * FROM users");
    const map = /* @__PURE__ */ new Map();
    for (const r of res.rows) map.set(r.id, mapUser(r));
    return map;
  }
  async findPurchaseByUserAndEbook(userId, ebookId) {
    const res = await pool.query(
      "SELECT * FROM purchases WHERE user_id = $1 AND ebook_id = $2 AND payment_status = 'SUCCESS'",
      [userId, ebookId]
    );
    if (res.rows.length === 0) return null;
    return this.enrichPurchase(mapPurchase(res.rows[0]));
  }
  async findPurchaseByOrderId(orderId) {
    const res = await pool.query("SELECT * FROM purchases WHERE razorpay_order_id = $1", [orderId]);
    if (res.rows.length === 0) return null;
    return this.enrichPurchase(mapPurchase(res.rows[0]));
  }
  async findPurchaseById(id) {
    const res = await pool.query("SELECT * FROM purchases WHERE id = $1", [id]);
    if (res.rows.length === 0) return null;
    return this.enrichPurchase(mapPurchase(res.rows[0]));
  }
  async createPurchaseOrder(data) {
    const ebook = await this.findEbookById(data.ebookId);
    const publicationType = ebook?.publicationType || (ebook?.comboItems && ebook.comboItems.length > 0 ? "COMBO" : "SINGLE");
    const comboItemsSnapshot = ebook?.comboItems ? JSON.parse(JSON.stringify(ebook.comboItems)) : void 0;
    const bonusItemsSnapshot = ebook?.bonusItems ? JSON.parse(JSON.stringify(ebook.bonusItems)) : void 0;
    const hasBonus = Boolean(ebook?.hasBonus || ebook?.bonusItems && ebook.bonusItems.length > 0);
    let bonusTitle = void 0;
    let bonusCoverImageUrl = void 0;
    let bonusEbookId = void 0;
    if (hasBonus && ebook) {
      if (ebook.bonusType === "existing" && ebook.bonusEbookId) {
        const bonusBook = await this.findEbookById(ebook.bonusEbookId);
        bonusEbookId = ebook.bonusEbookId;
        bonusTitle = bonusBook?.title || ebook.bonusTitle;
        bonusCoverImageUrl = bonusBook?.coverImageUrl;
      } else {
        bonusTitle = ebook.bonusTitle;
        bonusCoverImageUrl = ebook.bonusCoverImageUrl;
      }
    }
    const id = genId("pur");
    const now = (/* @__PURE__ */ new Date()).toISOString();
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
        id,
        data.userId,
        data.ebookId,
        data.amount,
        data.originalAmount ?? data.amount,
        data.discountAmount ?? 0,
        data.amount,
        data.currency,
        data.razorpayOrderId,
        null,
        null,
        now,
        publicationType,
        jsonVal(comboItemsSnapshot),
        jsonVal(bonusItemsSnapshot),
        data.couponId ?? null,
        data.couponCodeSnapshot ?? null,
        hasBonus,
        bonusEbookId ?? null,
        bonusTitle ?? null,
        bonusCoverImageUrl ?? null
      ]
    );
    return await this.findPurchaseById(id);
  }
  async verifyAndCompletePurchase(orderId, paymentId, signature) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const res = await client.query("SELECT * FROM purchases WHERE razorpay_order_id = $1", [orderId]);
      if (res.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }
      const purchase = mapPurchase(res.rows[0]);
      await client.query(
        `UPDATE purchases SET payment_status = 'SUCCESS', razorpay_payment_id = $1, razorpay_signature = $2, purchased_at = NOW() WHERE id = $3`,
        [paymentId, signature, purchase.id]
      );
      await client.query("UPDATE ebooks SET download_count = COALESCE(download_count, 0) + 1 WHERE id = $1", [purchase.ebookId]);
      if (purchase.couponId) {
        await client.query("UPDATE coupons SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1", [purchase.couponId]);
        await client.query(
          `INSERT INTO coupon_usages (id, coupon_id, user_id, purchase_id, used_at) VALUES ($1, $2, $3, $4, NOW())`,
          [genId("usg"), purchase.couponId, purchase.userId, purchase.id]
        );
      }
      await client.query("COMMIT");
      return this.findPurchaseById(purchase.id);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  async markPurchaseFailed(orderId) {
    await pool.query("UPDATE purchases SET payment_status = 'FAILED' WHERE razorpay_order_id = $1", [orderId]);
  }
  async getUserPurchases(userId) {
    const res = await pool.query(
      "SELECT * FROM purchases WHERE user_id = $1 AND payment_status = 'SUCCESS' ORDER BY purchased_at DESC",
      [userId]
    );
    const ebookMap = await this.loadEbookMap();
    const userMap = await this.loadUserMap();
    const out = [];
    for (const r of res.rows) out.push(await this.enrichPurchase(mapPurchase(r), ebookMap, userMap));
    return out;
  }
  async getAllPurchases(options = {}) {
    const params = [];
    let sql = `SELECT p.* FROM purchases p
      LEFT JOIN users u ON u.id = p.user_id
      LEFT JOIN ebooks e ON e.id = p.ebook_id
      WHERE 1 = 1`;
    if (options.status && options.status !== "all") {
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
    sql += " ORDER BY p.purchased_at DESC";
    const res = await pool.query(sql, params);
    const ebookMap = await this.loadEbookMap();
    const userMap = await this.loadUserMap();
    const out = [];
    for (const r of res.rows) out.push(await this.enrichPurchase(mapPurchase(r), ebookMap, userMap));
    return out;
  }
  async incrementDownloadCount(purchaseId) {
    await pool.query(
      "UPDATE purchases SET download_count = COALESCE(download_count, 0) + 1, last_downloaded_at = NOW() WHERE id = $1",
      [purchaseId]
    );
  }
  async incrementBonusDownloadCount(purchaseId) {
    await pool.query(
      "UPDATE purchases SET bonus_download_count = COALESCE(bonus_download_count, 0) + 1, bonus_last_downloaded_at = NOW() WHERE id = $1",
      [purchaseId]
    );
  }
  // --- ANALYTICS DASHBOARD ---
  async getDashboardStats() {
    const purchasesRes = await pool.query(
      "SELECT * FROM purchases WHERE payment_status = 'SUCCESS' ORDER BY purchased_at DESC"
    );
    const ebookMap = await this.loadEbookMap();
    const userMap = await this.loadUserMap();
    const successfulPurchases = purchasesRes.rows.map((r) => r);
    const totalEarnings = successfulPurchases.reduce((acc, r) => acc + Number(r.amount), 0);
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const todayPurchases = successfulPurchases.filter((r) => String(r.purchased_at).startsWith(today));
    const todayEarnings = todayPurchases.reduce((acc, r) => acc + Number(r.amount), 0);
    const totalPurchases = successfulPurchases.length;
    const usersCount = (await pool.query("SELECT COUNT(*)::int AS c FROM users")).rows[0].c;
    const ebooksCount = (await pool.query("SELECT COUNT(*)::int AS c FROM ebooks")).rows[0].c;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const activeCoupons = (await pool.query(
      "SELECT COUNT(*)::int AS c FROM coupons WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > $1)",
      [now]
    )).rows[0].c;
    const totalCouponUses = (await pool.query("SELECT COUNT(*)::int AS c FROM coupon_usages")).rows[0].c;
    const totalDiscountsGiven = successfulPurchases.reduce((acc, r) => acc + Number(r.discount_amount || 0), 0);
    const recentPurchases = [];
    for (const r of successfulPurchases.slice(0, 10)) {
      recentPurchases.push(await this.enrichPurchase(mapPurchase(r), ebookMap, userMap));
    }
    const salesMap = {};
    for (const r of successfulPurchases) {
      if (!salesMap[r.ebook_id]) salesMap[r.ebook_id] = { count: 0, revenue: 0 };
      salesMap[r.ebook_id].count += 1;
      salesMap[r.ebook_id].revenue += Number(r.amount);
    }
    const topSellingEbooks = Object.entries(salesMap).map(([ebookId, stats]) => {
      const ebook = ebookMap.get(ebookId);
      return ebook ? { ebook, salesCount: stats.count, revenue: Number(stats.revenue.toFixed(2)) } : null;
    }).filter((item) => item !== null).sort((a, b) => b.salesCount - a.salesCount).slice(0, 5);
    const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    const revenueByMonth = months.map((m, monthIndex) => {
      const salesInMonth = successfulPurchases.filter((p) => new Date(p.purchased_at).getMonth() === monthIndex + 2);
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
  async hasUserAccessToEbook(userId, targetId) {
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
          entitlementType: "PURCHASED",
          itemDetails: ebook ? {
            title: ebook.title,
            author: ebook.author,
            coverImageUrl: ebook.coverImageUrl,
            pdfUrl: ebook.pdfUrl,
            pageCount: ebook.pageCount,
            fileSize: ebook.fileSize
          } : void 0
        };
      }
      const comboItems = purchase.comboItemsSnapshot || ebook?.comboItems || [];
      const matchingComboItem = comboItems.find(
        (ci) => ci.id === targetId || ci.ebookId && ci.ebookId === targetId
      );
      if (matchingComboItem) {
        return {
          hasAccess: true,
          purchase,
          entitlementType: "COMBO_INCLUDED",
          itemDetails: {
            title: matchingComboItem.title,
            author: matchingComboItem.author,
            coverImageUrl: matchingComboItem.coverImageUrl || ebook?.coverImageUrl || "",
            pdfUrl: matchingComboItem.pdfUrl,
            pageCount: matchingComboItem.pageCount || 200,
            fileSize: matchingComboItem.fileSize || "10 MB"
          }
        };
      }
      const bonusItems = purchase.bonusItemsSnapshot || ebook?.bonusItems || [];
      const matchingBonusItem = bonusItems.find(
        (bi) => bi.id === targetId || bi.ebookId && bi.ebookId === targetId
      );
      if (matchingBonusItem) {
        return {
          hasAccess: true,
          purchase,
          entitlementType: "BONUS",
          itemDetails: {
            title: matchingBonusItem.title,
            author: matchingBonusItem.author || ebook?.author || "Editorial Author",
            coverImageUrl: matchingBonusItem.coverImageUrl || ebook?.coverImageUrl || "",
            pdfUrl: matchingBonusItem.pdfUrl,
            pageCount: matchingBonusItem.pageCount || 50,
            fileSize: matchingBonusItem.fileSize || "5 MB"
          }
        };
      }
      if (purchase.hasBonus || ebook?.hasBonus) {
        if (purchase.bonusEbookId === targetId || `bonus-${purchase.id}` === targetId || `bonus-custom-${purchase.ebookId}` === targetId || targetId === "bonus") {
          return {
            hasAccess: true,
            purchase,
            entitlementType: "BONUS",
            itemDetails: {
              title: purchase.bonusTitle || ebook?.bonusTitle || "Bonus Companion",
              author: ebook?.author || "Editorial Author",
              coverImageUrl: purchase.bonusCoverImageUrl || ebook?.bonusCoverImageUrl || ebook?.coverImageUrl || "",
              pdfUrl: ebook?.bonusPdfUrl,
              pageCount: ebook?.bonusPageCount || 50,
              fileSize: ebook?.bonusFileSize || "5 MB"
            }
          };
        }
      }
    }
    return { hasAccess: false };
  }
  async enrichPurchase(purchase, ebookMap, userMap) {
    const ebook = ebookMap?.get(purchase.ebookId) ?? await this.findEbookById(purchase.ebookId);
    const user = userMap?.get(purchase.userId) ?? await this.findUserById(purchase.userId);
    const publicationType = purchase.publicationType || ebook?.publicationType || (ebook?.comboItems && ebook.comboItems.length > 0 ? "COMBO" : "SINGLE");
    const comboItems = purchase.comboItemsSnapshot || ebook?.comboItems || [];
    const bonusItems = purchase.bonusItemsSnapshot || ebook?.bonusItems || [];
    const entitlements = [];
    if (publicationType === "COMBO" && comboItems.length > 0) {
      comboItems.forEach((ci) => {
        entitlements.push({
          id: `ent-${purchase.id}-${ci.id}`,
          itemId: ci.id,
          title: ci.title,
          author: ci.author,
          description: ci.description,
          coverImageUrl: ci.coverImageUrl || ebook?.coverImageUrl || "",
          pdfUrl: ci.pdfUrl,
          pageCount: ci.pageCount,
          fileSize: ci.fileSize,
          type: "COMBO_INCLUDED",
          parentEbookId: purchase.ebookId,
          parentTitle: ebook?.title || "Combo Package",
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
        type: "PURCHASED",
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
          title: bi.title || "Bonus Companion Guide",
          author: bi.author || ebook?.author || "Editorial Author",
          description: bi.description || "Free companion edition included with this purchase.",
          coverImageUrl: bi.coverImageUrl || ebook?.coverImageUrl || "",
          pdfUrl: bi.pdfUrl,
          pageCount: bi.pageCount || 50,
          fileSize: bi.fileSize || "4.5 MB",
          type: "BONUS",
          parentEbookId: purchase.ebookId,
          parentTitle: ebook?.title || "Main Publication",
          downloadUrl: `/api/ebooks/${purchase.ebookId}/download?bonusItemId=${bi.id || bIdx}&type=bonus`
        });
      });
    } else if (purchase.hasBonus || ebook?.hasBonus) {
      const bonusTitle = purchase.bonusTitle || ebook?.bonusTitle || "Bonus Companion Guide";
      const bonusCover = purchase.bonusCoverImageUrl || ebook?.bonusCoverImageUrl || ebook?.coverImageUrl || "";
      entitlements.push({
        id: `ent-${purchase.id}-bonus`,
        itemId: `bonus-${purchase.id}`,
        title: bonusTitle,
        author: ebook?.author || "Editorial Author",
        description: ebook?.bonusDescription || "Free companion edition included with this purchase.",
        coverImageUrl: bonusCover,
        pdfUrl: ebook?.bonusPdfUrl,
        pageCount: ebook?.bonusPageCount || 50,
        fileSize: ebook?.bonusFileSize || "4.5 MB",
        type: "BONUS",
        parentEbookId: purchase.ebookId,
        parentTitle: ebook?.title || "Main Publication",
        downloadUrl: `/api/ebooks/${purchase.ebookId}/download?type=bonus`
      });
    }
    return {
      ...purchase,
      publicationType,
      comboItemsSnapshot: comboItems,
      bonusItemsSnapshot: bonusItems,
      entitlements,
      user: user ? { name: user.name, email: user.email } : void 0,
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
      } : void 0
    };
  }
};
var db = new Database();

// server/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || "default-secret-change-in-production";
if (!process.env.AUTH_SECRET && !process.env.JWT_SECRET) {
  console.error("[auth] AUTH_SECRET (or JWT_SECRET) is not set. Using default secret which is insecure for production.");
}
function generateToken(user) {
  return import_jsonwebtoken.default.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function hashPassword(password) {
  return import_bcryptjs.default.hashSync(password, 10);
}
function comparePassword(password, hash) {
  return import_bcryptjs.default.compareSync(password, hash);
}
async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error("GOOGLE_CLIENT_ID or VITE_GOOGLE_CLIENT_ID is not configured on the server.");
    return null;
  }
  try {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!resp.ok) {
      console.error("Google tokeninfo request failed:", resp.status, resp.statusText);
      return null;
    }
    const payload = await resp.json();
    if (payload.aud !== clientId) {
      console.error("Google token audience mismatch. Expected:", clientId, "Got:", payload.aud);
      return null;
    }
    if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") {
      console.error("Google token issuer invalid:", payload.iss);
      return null;
    }
    if (Number(payload.exp) * 1e3 < Date.now()) {
      console.error("Google token expired:", new Date(Number(payload.exp) * 1e3).toISOString());
      return null;
    }
    if (payload.email_verified === "false" || payload.email_verified === false) {
      console.error("Google email not verified for:", payload.email);
      return null;
    }
    if (!payload.email) {
      console.error("Google token missing email");
      return null;
    }
    return { email: payload.email, name: payload.name };
  } catch (err) {
    console.error("Google token verification error:", err);
    return null;
  }
}
async function authMiddleware(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === "string") {
      token = req.query.token;
    }
    if (!token) {
      return res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
    }
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = await db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "USER_NOT_FOUND", message: "User account no longer exists" });
    }
    if (!user.isActive) {
      return res.status(403).json({ error: "ACCOUNT_DEACTIVATED", message: "Your account has been deactivated. Please contact support." });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN", message: "Session invalid or expired" });
  }
}
async function optionalAuthMiddleware(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if (req.query.token && typeof req.query.token === "string") {
      token = req.query.token;
    }
    if (token) {
      const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
      const user = await db.findUserById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
  }
  next();
}
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "FORBIDDEN", message: "Administrator privileges required" });
  }
  next();
}

// server/routes/auth.ts
var router = (0, import_express.Router)();
var ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
var ADMIN_PASSWORD_HASH = ADMIN_PASSWORD ? hashPassword(ADMIN_PASSWORD) : null;
if (!ADMIN_EMAIL) {
  console.warn("[auth] ADMIN_EMAIL is not set. Admin login will be unavailable.");
}
if (!ADMIN_PASSWORD) {
  console.warn("[auth] ADMIN_PASSWORD is not set. Admin login will be unavailable.");
}
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  console.log("[auth] Admin credentials configured for:", ADMIN_EMAIL);
}
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Name, email, and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Password must be at least 6 characters" });
    }
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Passwords do not match" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Please provide a valid email address" });
    }
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "DUPLICATE_EMAIL", message: "An account with this email already exists" });
    }
    const passwordHash = hashPassword(password);
    const newUser = await db.createUser({
      name,
      email,
      passwordHash,
      role: "USER"
    });
    const token = generateToken(newUser);
    return res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to complete registration" });
  }
});
router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Google authentication token is missing" });
    }
    const payload = await verifyGoogleIdToken(idToken);
    if (!payload || !payload.email) {
      return res.status(401).json({ error: "INVALID_GOOGLE_TOKEN", message: "Could not verify your Google account" });
    }
    const email = payload.email.toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const name = (payload.name || email.split("@")[0]).trim();
    let user = await db.findUserByEmail(email);
    if (email === adminEmail || user?.role === "ADMIN") {
      return res.status(403).json({
        error: "ADMIN_GOOGLE_LOGIN_DISABLED",
        message: "Administrator accounts must sign in with email and password from the admin login page."
      });
    }
    if (!user) {
      const randomHash = hashPassword(`${Math.random().toString(36).slice(2)}${Date.now()}`);
      const created = await db.createUser({
        name,
        email,
        passwordHash: randomHash,
        role: "USER"
      });
      user = created;
    }
    await db.updateUser(user.id, { lastLoginAt: (/* @__PURE__ */ new Date()).toISOString() });
    const safeUser = await db.findUserById(user.id);
    if (!safeUser) {
      return res.status(500).json({ error: "SERVER_ERROR", message: "User retrieval failed" });
    }
    const token = generateToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(401).json({ error: "GOOGLE_AUTH_FAILED", message: "Google sign-in failed. Please try again." });
  }
});
router.post("/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      return res.status(500).json({ error: "SERVER_ERROR", message: "Admin authentication is not configured on the server." });
    }
    if (!email || !password) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email and password are required" });
    }
    if (email.toLowerCase().trim() !== ADMIN_EMAIL || !comparePassword(password, ADMIN_PASSWORD_HASH)) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid administrator credentials" });
    }
    let user = await db.findUserByEmail(ADMIN_EMAIL);
    if (!user) {
      const randomHash = hashPassword(`${Math.random().toString(36).slice(2)}${Date.now()}`);
      const created = await db.createUser({
        name: ADMIN_EMAIL.split("@")[0],
        email: ADMIN_EMAIL,
        passwordHash: randomHash,
        role: "ADMIN"
      });
      user = created;
    } else if (user.role !== "ADMIN") {
      await db.updateUser(user.id, { role: "ADMIN" });
    }
    await db.updateUser(user.id, { lastLoginAt: (/* @__PURE__ */ new Date()).toISOString() });
    const safeUser = await db.findUserById(user.id);
    if (!safeUser) {
      return res.status(500).json({ error: "SERVER_ERROR", message: "User retrieval failed" });
    }
    const token = generateToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Admin login failed" });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email and password are required" });
    }
    const userWithHash = await db.findUserByEmail(email);
    if (!userWithHash) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }
    if (!userWithHash.isActive) {
      return res.status(403).json({ error: "ACCOUNT_DEACTIVATED", message: "Your account has been deactivated. Please contact support." });
    }
    const isValid = comparePassword(password, userWithHash.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    }
    await db.updateUser(userWithHash.id, { lastLoginAt: (/* @__PURE__ */ new Date()).toISOString() });
    const safeUser = await db.findUserById(userWithHash.id);
    if (!safeUser) {
      return res.status(500).json({ error: "SERVER_ERROR", message: "User retrieval failed" });
    }
    const token = generateToken(safeUser);
    return res.json({ token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Authentication failed" });
  }
});
router.get("/me", authMiddleware, async (req, res) => {
  return res.json({ user: req.user });
});
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const updates = {};
    if (name && name.trim()) {
      updates.name = name.trim();
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "VALIDATION_ERROR", message: "New password must be at least 6 characters" });
      }
      const userWithHash = await db.findUserWithHashById(userId);
      if (!userWithHash) {
        return res.status(404).json({ error: "NOT_FOUND", message: "User not found" });
      }
      if (!currentPassword || !comparePassword(currentPassword, userWithHash.passwordHash)) {
        return res.status(400).json({ error: "INVALID_PASSWORD", message: "Current password is incorrect" });
      }
      updates.passwordHash = hashPassword(newPassword);
    }
    const updatedUser = await db.updateUser(userId, updates);
    return res.json({ user: updatedUser, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update profile" });
  }
});
var auth_default = router;

// server/routes/ebooks.ts
var import_express2 = require("express");
var router2 = (0, import_express2.Router)();
router2.get("/", optionalAuthMiddleware, async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const isAdmin = req.user?.role === "ADMIN";
    const ebooks = await db.getAllEbooks({
      search: typeof search === "string" ? search : void 0,
      category: typeof category === "string" ? category : void 0,
      sort: typeof sort === "string" ? sort : "newest",
      publishedOnly: !isAdmin
    });
    return res.json({ ebooks });
  } catch (err) {
    console.error("Error fetching ebooks:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch ebooks" });
  }
});
router2.get("/featured", async (req, res) => {
  try {
    const ebooks = await db.getAllEbooks({ publishedOnly: true, sort: "featured" });
    return res.json({ ebooks: ebooks.filter((e) => e.featured).slice(0, 6) });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch featured ebooks" });
  }
});
router2.get("/categories", async (req, res) => {
  try {
    const dbCategories = await db.getAllCategories({ activeOnly: true });
    const categoryNames = dbCategories.map((c) => c.name);
    const ebooks = await db.getAllEbooks({ publishedOnly: true });
    const allNames = Array.from(/* @__PURE__ */ new Set([...categoryNames, ...ebooks.map((e) => e.category)])).filter(Boolean);
    return res.json({ categories: allNames, categoryList: dbCategories });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch categories" });
  }
});
router2.get("/:slug", optionalAuthMiddleware, async (req, res) => {
  try {
    const { slug } = req.params;
    const ebook = await db.findEbookBySlug(slug);
    if (!ebook) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook not found" });
    }
    if (!ebook.published && req.user?.role !== "ADMIN") {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook is not currently published" });
    }
    let isPurchased = false;
    let purchaseId = null;
    if (req.user) {
      const purchase = await db.findPurchaseByUserAndEbook(req.user.id, ebook.id);
      if (purchase && purchase.paymentStatus === "SUCCESS") {
        isPurchased = true;
        purchaseId = purchase.id;
      }
    }
    const safeEbook = {
      ...ebook,
      // Provide preview information
      isPurchased,
      purchaseId
    };
    return res.json({ ebook: safeEbook });
  } catch (err) {
    console.error("Error fetching ebook detail:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch ebook details" });
  }
});
var ebooks_default = router2;

// server/routes/payments.ts
var import_express3 = require("express");
var import_crypto = __toESM(require("crypto"), 1);
var import_razorpay = __toESM(require("razorpay"), 1);
var router3 = (0, import_express3.Router)();
var getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (key_id && key_secret) {
    try {
      return new import_razorpay.default({ key_id, key_secret });
    } catch (e) {
      console.error("Razorpay SDK initialization failed:", e);
    }
  }
  return null;
};
router3.post("/validate-coupon", async (req, res) => {
  try {
    const { code, ebookId } = req.body;
    const userId = req.user?.id;
    if (!code || !ebookId) {
      return res.status(400).json({
        valid: false,
        message: "Both coupon code and ebook ID are required."
      });
    }
    const validation = await db.validateCouponForEbook(code, ebookId, userId);
    if (!validation.valid) {
      return res.status(400).json({
        valid: false,
        errorType: validation.errorType,
        message: validation.message,
        originalPrice: validation.originalPrice,
        discountAmount: 0,
        finalPrice: validation.originalPrice,
        currency: validation.currency
      });
    }
    return res.json({
      valid: true,
      coupon: {
        id: validation.coupon.id,
        code: validation.coupon.code,
        discountPercentage: validation.coupon.discountPercentage,
        expiresAt: validation.coupon.expiresAt,
        unlimitedUsage: validation.coupon.unlimitedUsage,
        remainingUses: validation.coupon.unlimitedUsage ? void 0 : Math.max(0, validation.coupon.usageLimit - validation.coupon.usageCount)
      },
      originalPrice: validation.originalPrice,
      discountAmount: validation.discountAmount,
      finalPrice: validation.finalPrice,
      currency: validation.currency,
      message: `${validation.coupon.discountPercentage}% discount applied successfully!`
    });
  } catch (err) {
    console.error("Error validating coupon:", err);
    return res.status(500).json({
      valid: false,
      message: err.message || "Internal server error while validating coupon."
    });
  }
});
router3.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { ebookId, couponCode } = req.body;
    const user = req.user;
    if (!ebookId) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Ebook ID is required" });
    }
    const ebook = await db.findEbookById(ebookId);
    if (!ebook) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook not found" });
    }
    if (!ebook.published && user.role !== "ADMIN") {
      return res.status(400).json({ error: "UNPUBLISHED", message: "This ebook is not currently available for purchase" });
    }
    const existingPurchase = await db.findPurchaseByUserAndEbook(user.id, ebook.id);
    if (existingPurchase) {
      return res.status(409).json({
        error: "ALREADY_PURCHASED",
        message: "You already own this ebook. You can download it directly from your library.",
        purchaseId: existingPurchase.id
      });
    }
    const currency = ebook.currency || "INR";
    let originalPrice = ebook.price;
    let discountAmount = 0;
    let finalPrice = ebook.price;
    let appliedCouponId = void 0;
    let appliedCouponCode = void 0;
    let couponDiscountPercentage = 0;
    if (couponCode && String(couponCode).trim()) {
      const validation = await db.validateCouponForEbook(String(couponCode).trim(), ebook.id, user.id);
      if (!validation.valid) {
        return res.status(400).json({
          error: "INVALID_COUPON",
          errorType: validation.errorType,
          message: validation.message
        });
      }
      originalPrice = validation.originalPrice;
      discountAmount = validation.discountAmount;
      finalPrice = validation.finalPrice;
      appliedCouponId = validation.coupon?.id;
      appliedCouponCode = validation.coupon?.code;
      couponDiscountPercentage = validation.coupon?.discountPercentage || 0;
    }
    const amountInPaise = Math.round(finalPrice * 100);
    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(500).json({
        error: "PAYMENT_CONFIG_ERROR",
        message: "Razorpay payment configuration is missing. Please contact support."
      });
    }
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: `rcpt_${Date.now().toString().slice(-8)}`,
      notes: {
        userId: user.id,
        userEmail: user.email,
        ebookId: ebook.id,
        ebookTitle: ebook.title,
        couponCode: appliedCouponCode || "NONE",
        discountAmount: discountAmount.toString()
      }
    });
    const orderId = order.id;
    await db.createPurchaseOrder({
      userId: user.id,
      ebookId: ebook.id,
      amount: finalPrice,
      originalAmount: originalPrice,
      discountAmount,
      currency,
      razorpayOrderId: orderId,
      couponId: appliedCouponId,
      couponCodeSnapshot: appliedCouponCode
    });
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) {
      return res.status(500).json({
        error: "PAYMENT_CONFIG_ERROR",
        message: "Razorpay payment configuration is missing. Please contact support."
      });
    }
    const isTestMode = keyId.startsWith("rzp_test_");
    return res.json({
      orderId,
      amount: amountInPaise,
      originalAmount: originalPrice,
      discountAmount,
      finalAmount: finalPrice,
      currency,
      keyId,
      ebookTitle: ebook.title,
      ebookId: ebook.id,
      userEmail: user.email,
      userName: user.name,
      isTestMode,
      couponApplied: appliedCouponCode ? {
        code: appliedCouponCode,
        discountPercentage: couponDiscountPercentage,
        discountAmount
      } : void 0,
      bonusIncluded: ebook.hasBonus ? {
        title: ebook.bonusTitle || "Bonus Digital Companion",
        coverImageUrl: ebook.bonusCoverImageUrl
      } : void 0
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    return res.status(500).json({ error: "PAYMENT_ORDER_FAILED", message: err.message || "Failed to initiate payment" });
  }
});
router3.post("/verify", authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ebookId } = req.body;
    const user = req.user;
    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Order ID and Payment ID are required" });
    }
    const purchase = await db.findPurchaseByOrderId(razorpay_order_id);
    if (!purchase) {
      return res.status(404).json({ error: "ORDER_NOT_FOUND", message: "Purchase order record not found" });
    }
    if (purchase.userId !== user.id) {
      return res.status(403).json({ error: "FORBIDDEN", message: "This order does not belong to the current user" });
    }
    if (purchase.paymentStatus === "SUCCESS") {
      return res.json({
        success: true,
        message: "Payment already verified",
        purchaseId: purchase.id
      });
    }
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let isValid = false;
    if (keySecret && !keySecret.includes("sample")) {
      const generatedSignature = import_crypto.default.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
      isValid = generatedSignature === razorpay_signature;
    } else {
      isValid = Boolean(razorpay_payment_id && razorpay_order_id);
    }
    if (!isValid) {
      await db.markPurchaseFailed(razorpay_order_id);
      return res.status(400).json({
        error: "INVALID_SIGNATURE",
        message: "Payment verification failed. Security signature is invalid."
      });
    }
    const completedPurchase = await db.verifyAndCompletePurchase(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || "sig_verified_demo"
    );
    if (!completedPurchase) {
      return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update purchase record" });
    }
    return res.json({
      success: true,
      message: "Payment successfully verified",
      purchase: completedPurchase
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    return res.status(500).json({ error: "VERIFICATION_FAILED", message: err.message || "Payment verification failed" });
  }
});
var payments_default = router3;

// server/routes/download.ts
var import_express4 = require("express");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var router4 = (0, import_express4.Router)();
function generateEditorialPdfBuffer(ebook, purchaserEmail) {
  const sanitizedTitle = ebook.title.replace(/[^\x20-\x7E]/g, "");
  const sanitizedAuthor = ebook.author.replace(/[^\x20-\x7E]/g, "");
  const sanitizedDesc = ebook.description.replace(/[^\x20-\x7E]/g, "");
  const dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 7 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 8 0 R >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
7 0 obj
<< /Length 580 >>
stream
BT
/F1 28 Tf
54 700 Td
(${sanitizedTitle.substring(0, 45)}) Tj
0 -36 Td
/F2 16 Tf
(By ${sanitizedAuthor.substring(0, 50)}) Tj
0 -30 Td
/F2 12 Tf
(Category: ${ebook.category}) Tj
0 -40 Td
/F1 14 Tf
(OFFICIAL DIGITAL EDITION) Tj
0 -25 Td
/F2 11 Tf
(Licensed exclusively to: ${purchaserEmail}) Tj
0 -20 Td
(Purchase Timestamp: ${dateStr}) Tj
0 -40 Td
/F1 14 Tf
(SYNOPSIS & INTRODUCTION) Tj
0 -25 Td
/F2 11 Tf
(${sanitizedDesc.substring(0, 100)}...) Tj
0 -50 Td
/F2 10 Tf
(Total Extent: ${ebook.pageCount} Pages | Cryptographically Verified & Watermarked) Tj
ET
endstream
endobj
8 0 obj
<< /Length 380 >>
stream
BT
/F1 20 Tf
54 700 Td
(CHAPTER 1: THE CORE FRAMEWORK) Tj
0 -40 Td
/F2 12 Tf
(Thank you for supporting independent digital publishing.) Tj
0 -25 Td
(This digital copy is protected by international copyright law.) Tj
0 -25 Td
(All rights reserved. Unauthorized reproduction or redistribution is prohibited.) Tj
0 -40 Td
(Reader Access Verified: ${purchaserEmail}) Tj
ET
endstream
endobj
xref
0 9
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000121 00000 n 
0000000244 00000 n 
0000000367 00000 n 
0000000438 00000 n 
0000000504 00000 n 
0000001140 00000 n 
trailer
<< /Size 9 /Root 1 0 R >>
startxref
1575
%%EOF`;
  return Buffer.from(pdfString, "utf-8");
}
router4.get("/:id/download", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const isBonus = req.query.type === "bonus";
    const comboItemId = req.query.comboItemId;
    const user = req.user;
    const ebook = await db.findEbookById(id) || await db.findEbookBySlug(id);
    if (!ebook) {
      return res.status(404).send("Ebook not found");
    }
    const isAdmin = user.role === "ADMIN";
    const accessCheck = await db.hasUserAccessToEbook(user.id, ebook.id);
    if (!isAdmin && !accessCheck.hasAccess) {
      return res.status(403).send("Unauthorized: You have not purchased this ebook or combo package yet.");
    }
    const purchase = accessCheck.purchase;
    if (comboItemId) {
      const comboItems = ebook.comboItems || [];
      const item = comboItems.find((ci) => ci.id === comboItemId);
      if (!item) {
        return res.status(404).send("Combo item not found in this package.");
      }
      if (purchase) {
        await db.incrementDownloadCount(purchase.id);
      }
      const safeItemFileName = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-edition.pdf`;
      let targetPdfUrl = item.pdfUrl;
      if (item.ebookId) {
        const linked = await db.findEbookById(item.ebookId);
        if (linked?.pdfUrl) {
          targetPdfUrl = linked.pdfUrl;
        }
      }
      if (targetPdfUrl && targetPdfUrl.startsWith("/uploads/")) {
        const localFilePath = import_path.default.join(process.cwd(), targetPdfUrl);
        if (import_fs.default.existsSync(localFilePath)) {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${safeItemFileName}"`);
          return import_fs.default.createReadStream(localFilePath).pipe(res);
        }
      }
      const itemBuffer = generateEditorialPdfBuffer(
        {
          title: item.title,
          author: item.author,
          category: `Combo Volume \u2022 ${ebook.category}`,
          description: item.description || `Volume included in ${ebook.title}`,
          pageCount: item.pageCount || 240
        },
        user.email
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeItemFileName}"`);
      res.setHeader("Content-Length", itemBuffer.length);
      return res.end(itemBuffer);
    }
    const bonusItemId = req.query.bonusItemId;
    if (isBonus || bonusItemId) {
      if (!ebook.hasBonus && (!ebook.bonusItems || ebook.bonusItems.length === 0)) {
        return res.status(404).send("This publication does not include a bonus companion.");
      }
      if (purchase) {
        await db.incrementBonusDownloadCount(purchase.id);
      }
      let targetBonusItem = (ebook.bonusItems || []).find((b) => b.id === bonusItemId);
      if (!targetBonusItem && ebook.bonusItems && ebook.bonusItems.length > 0 && !isBonus) {
        targetBonusItem = ebook.bonusItems[0];
      }
      let bonusTitle = targetBonusItem?.title || ebook.bonusTitle || `${ebook.title} Bonus Companion`;
      let bonusAuthor = targetBonusItem?.author || ebook.author || "Editorial Author";
      let bonusDescription = targetBonusItem?.description || ebook.bonusDescription || `Exclusive digital companion to ${ebook.title}`;
      let targetPdfUrl = targetBonusItem?.pdfUrl || ebook.bonusPdfUrl;
      let targetPageCount = targetBonusItem?.pageCount || ebook.bonusPageCount || 50;
      const safeBonusFileName = `${(targetBonusItem?.title || ebook.slug || "ebook").toLowerCase().replace(/[^a-z0-9]/g, "-")}-bonus.pdf`;
      if (targetBonusItem?.sourceType === "existing" && targetBonusItem.ebookId) {
        const existingBonus = await db.findEbookById(targetBonusItem.ebookId);
        if (existingBonus) {
          bonusTitle = targetBonusItem.title || existingBonus.title;
          bonusAuthor = targetBonusItem.author || existingBonus.author;
          targetPdfUrl = targetBonusItem.pdfUrl || existingBonus.pdfUrl;
          targetPageCount = targetBonusItem.pageCount || existingBonus.pageCount;
        }
      } else if (ebook.bonusType === "existing" && ebook.bonusEbookId) {
        const existingBonus = await db.findEbookById(ebook.bonusEbookId);
        if (existingBonus) {
          targetPdfUrl = existingBonus.pdfUrl;
          targetPageCount = existingBonus.pageCount;
        }
      }
      if (targetPdfUrl && targetPdfUrl.startsWith("/uploads/")) {
        const localFilePath = import_path.default.join(process.cwd(), targetPdfUrl);
        if (import_fs.default.existsSync(localFilePath)) {
          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${safeBonusFileName}"`);
          return import_fs.default.createReadStream(localFilePath).pipe(res);
        }
      }
      const bonusBuffer = generateEditorialPdfBuffer(
        {
          title: `[BONUS COMPANION] ${bonusTitle}`,
          author: bonusAuthor,
          category: `Bonus Companion \u2022 ${ebook.category}`,
          description: bonusDescription,
          pageCount: targetPageCount
        },
        user.email
      );
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeBonusFileName}"`);
      res.setHeader("Content-Length", bonusBuffer.length);
      return res.end(bonusBuffer);
    }
    if (purchase) {
      await db.incrementDownloadCount(purchase.id);
    }
    const safeFileName = `${ebook.slug || "ebook"}.pdf`;
    if (ebook.pdfUrl && ebook.pdfUrl.startsWith("/uploads/")) {
      const localFilePath = import_path.default.join(process.cwd(), ebook.pdfUrl);
      if (import_fs.default.existsSync(localFilePath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
        return import_fs.default.createReadStream(localFilePath).pipe(res);
      }
    }
    const pdfBuffer = generateEditorialPdfBuffer(ebook, user.email);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    console.error("Error during secure PDF download:", err);
    return res.status(500).send("An error occurred during file delivery. Please try again or contact support.");
  }
});
router4.get("/:id/bonus-download", authMiddleware, async (req, res) => {
  req.query.type = "bonus";
  const handler = router4.stack.find((layer) => layer.route?.path === "/:id/download")?.handle;
  if (handler) {
    return handler(req, res, () => {
    });
  }
  return res.redirect(`/api/ebooks/${req.params.id}/download?type=bonus`);
});
router4.get("/:id/pdf-content", async (req, res) => {
  try {
    const { id } = req.params;
    const ebook = await db.findEbookById(id) || await db.findEbookBySlug(id);
    if (!ebook) {
      return res.status(404).send("Ebook not found");
    }
    const previewBuffer = generateEditorialPdfBuffer(ebook, "PREVIEW SAMPLE ONLY");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${ebook.slug}-sample.pdf"`);
    res.setHeader("Content-Length", previewBuffer.length);
    return res.end(previewBuffer);
  } catch (err) {
    return res.status(500).send("Preview unavailable");
  }
});
var download_default = router4;

// server/routes/user.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
router5.get("/purchases", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const purchases = await db.getUserPurchases(userId);
    return res.json({ purchases });
  } catch (err) {
    console.error("Error fetching user purchases:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch your purchases" });
  }
});
router5.get("/purchases/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await db.findPurchaseById(id);
    if (!purchase) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Purchase record not found" });
    }
    if (purchase.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "FORBIDDEN", message: "Unauthorized to view this purchase" });
    }
    return res.json({ purchase });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch purchase details" });
  }
});
var user_default = router5;

// server/routes/admin.ts
var import_express6 = require("express");
var router6 = (0, import_express6.Router)();
router6.use(authMiddleware);
router6.use(adminMiddleware);
function slugify(text) {
  return text.toString().toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}
router6.get("/dashboard", async (req, res) => {
  try {
    const stats = await db.getDashboardStats();
    return res.json({ stats });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to compute dashboard metrics" });
  }
});
router6.get("/ebooks", async (req, res) => {
  try {
    const ebooks = await db.getAllEbooks({ publishedOnly: false });
    return res.json({ ebooks });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to retrieve ebooks" });
  }
});
router6.get("/ebooks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ebook = await db.findEbookById(id) || await db.findEbookBySlug(id);
    if (!ebook) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook not found" });
    }
    return res.json({ ebook });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to retrieve ebook" });
  }
});
router6.post("/ebooks", async (req, res) => {
  try {
    const {
      title,
      description,
      author,
      category,
      price,
      currency,
      publicationType,
      totalOriginalValue,
      comboItems,
      coverImageUrl,
      coverPublicId,
      pdfUrl,
      pdfPublicId,
      cloudinaryResourceType,
      fileSize,
      pageCount,
      featured,
      published,
      sampleChapter
    } = req.body;
    if (!title || !description || price === void 0 || !coverImageUrl) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Title, description, price, and cover image are required"
      });
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Price must be a valid positive number" });
    }
    let slug = slugify(title);
    const existing = await db.findEbookBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    const cleanPublicationType = publicationType === "COMBO" ? "COMBO" : "SINGLE";
    let cleanComboItems = void 0;
    if (Array.isArray(comboItems) && comboItems.length > 0) {
      cleanComboItems = [];
      for (let idx = 0; idx < comboItems.length; idx++) {
        const raw = comboItems[idx];
        const isCatalog = raw.sourceType === "catalog" || raw.ebookId && !raw.sourceType;
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanComboItems.push({
              id: raw.id || `citem-${Date.now()}-${idx}`,
              sourceType: "catalog",
              ebookId: catalogBook.id,
              title: catalogBook.title,
              author: catalogBook.author,
              category: catalogBook.category,
              description: catalogBook.description,
              price: catalogBook.price,
              pageCount: catalogBook.pageCount,
              fileSize: catalogBook.fileSize,
              coverImageUrl: catalogBook.coverImageUrl,
              pdfUrl: catalogBook.pdfUrl
            });
            continue;
          }
        }
        const customSlug = `${slugify(raw.title || "volume")}-${Date.now().toString().slice(-4)}`;
        let customEbookId = raw.ebookId;
        if (customEbookId) {
          const existingCustom = await db.findEbookById(customEbookId);
          if (existingCustom) {
            await db.updateEbook(customEbookId, {
              title: (raw.title || existingCustom.title).trim(),
              author: (raw.author || existingCustom.author || author || "Author").trim(),
              category: (raw.category || existingCustom.category || category || "General").trim(),
              description: (raw.description || existingCustom.description).trim(),
              price: raw.price !== void 0 ? Number(raw.price) : existingCustom.price,
              coverImageUrl: raw.coverImageUrl || existingCustom.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingCustom.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingCustom.pageCount,
              fileSize: raw.fileSize || existingCustom.fileSize
            });
          } else {
            customEbookId = void 0;
          }
        }
        if (!customEbookId) {
          const created = await db.createEbook({
            title: (raw.title || "Custom Volume").trim(),
            slug: customSlug,
            description: (raw.description || "Custom volume in combo.").trim(),
            author: (raw.author || author || "Editorial Staff").trim(),
            category: (raw.category || category || "Technology & Engineering").trim(),
            price: raw.price !== void 0 ? Number(raw.price) : 399,
            currency: currency || "INR",
            publicationType: "SINGLE",
            coverImageUrl: raw.coverImageUrl || coverImageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80",
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 150,
            fileSize: raw.fileSize || "10 MB",
            featured: false,
            published: false
          });
          customEbookId = created.id;
        }
        cleanComboItems.push({
          id: raw.id || `citem-${Date.now()}-${idx}`,
          sourceType: "custom",
          ebookId: customEbookId,
          title: (raw.title || "Untitled Volume").trim(),
          author: (raw.author || author || "Author").trim(),
          category: (raw.category || category || "General").trim(),
          description: (raw.description || "").trim(),
          price: raw.price !== void 0 ? Number(raw.price) : 399,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 150,
          fileSize: raw.fileSize || "10 MB",
          coverImageUrl: raw.coverImageUrl || coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName
        });
      }
    }
    let cleanBonusItems = void 0;
    if (Array.isArray(req.body.bonusItems) && req.body.bonusItems.length > 0) {
      cleanBonusItems = [];
      for (let idx = 0; idx < req.body.bonusItems.length; idx++) {
        const raw = req.body.bonusItems[idx];
        const isCatalog = raw.sourceType === "existing" || raw.sourceType === "catalog";
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanBonusItems.push({
              id: raw.id || `bitem-${Date.now()}-${idx}`,
              sourceType: "existing",
              ebookId: catalogBook.id,
              title: catalogBook.title,
              author: catalogBook.author,
              category: catalogBook.category,
              description: catalogBook.description || "Included free as a bonus companion edition.",
              coverImageUrl: catalogBook.coverImageUrl,
              pdfUrl: catalogBook.pdfUrl,
              pageCount: catalogBook.pageCount,
              fileSize: catalogBook.fileSize,
              price: catalogBook.price
            });
            continue;
          }
        }
        const customSlug = `${slugify(raw.title || "bonus-guide")}-${Date.now().toString().slice(-4)}`;
        let customBonusEbookId = raw.ebookId;
        if (customBonusEbookId) {
          const existingBonus = await db.findEbookById(customBonusEbookId);
          if (existingBonus) {
            await db.updateEbook(customBonusEbookId, {
              title: (raw.title || existingBonus.title).trim(),
              author: (raw.author || existingBonus.author || author || "Author").trim(),
              category: (raw.category || existingBonus.category || category || "General").trim(),
              description: (raw.description || existingBonus.description).trim(),
              price: raw.price !== void 0 ? Number(raw.price) : existingBonus.price,
              coverImageUrl: raw.coverImageUrl || existingBonus.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingBonus.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingBonus.pageCount,
              fileSize: raw.fileSize || existingBonus.fileSize
            });
          } else {
            customBonusEbookId = void 0;
          }
        }
        if (!customBonusEbookId) {
          const created = await db.createEbook({
            title: (raw.title || "Bonus Companion Guide").trim(),
            slug: customSlug,
            description: (raw.description || "Exclusive digital companion guide.").trim(),
            author: (raw.author || author || "Editorial Staff").trim(),
            category: (raw.category || category || "General").trim(),
            price: raw.price !== void 0 ? Number(raw.price) : 299,
            currency: currency || "INR",
            publicationType: "SINGLE",
            coverImageUrl: raw.coverImageUrl || coverImageUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 50,
            fileSize: raw.fileSize || "5.0 MB",
            featured: false,
            published: false
          });
          customBonusEbookId = created.id;
        }
        cleanBonusItems.push({
          id: raw.id || `bitem-${Date.now()}-${idx}`,
          sourceType: "custom",
          ebookId: customBonusEbookId,
          title: (raw.title || "Untitled Bonus Volume").trim(),
          author: (raw.author || author || "Author").trim(),
          category: (raw.category || category || "General").trim(),
          description: (raw.description || "").trim(),
          coverImageUrl: raw.coverImageUrl || coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 50,
          fileSize: raw.fileSize || "5.0 MB",
          price: raw.price !== void 0 ? Number(raw.price) : 299
        });
      }
    }
    const newEbook = await db.createEbook({
      title: title.trim(),
      slug,
      description: description.trim(),
      author: (author || "Editorial Staff").trim(),
      category: (category || "General").trim(),
      price: numPrice,
      currency: currency || "INR",
      publicationType: cleanPublicationType,
      totalOriginalValue: totalOriginalValue ? Number(totalOriginalValue) : void 0,
      comboItems: cleanComboItems,
      bonusItems: cleanBonusItems,
      coverImageUrl,
      coverPublicId,
      pdfUrl: pdfUrl || `/api/ebooks/${slug}/pdf-content`,
      pdfPublicId,
      cloudinaryResourceType,
      fileSize: fileSize || "12.5 MB",
      pageCount: Number(pageCount) || 200,
      featured: Boolean(featured),
      published: published !== void 0 ? Boolean(published) : true,
      sampleChapter: sampleChapter || "Chapter 1 Preview available upon purchase...",
      hasBonus: Boolean(req.body.hasBonus || cleanBonusItems && cleanBonusItems.length > 0),
      bonusType: req.body.bonusType || "custom",
      bonusEbookId: req.body.bonusEbookId,
      bonusTitle: req.body.bonusTitle?.trim(),
      bonusDescription: req.body.bonusDescription?.trim(),
      bonusCoverImageUrl: req.body.bonusCoverImageUrl,
      bonusPdfUrl: req.body.bonusPdfUrl,
      bonusPageCount: Number(req.body.bonusPageCount) || 50,
      bonusFileSize: req.body.bonusFileSize || "5.0 MB"
    });
    if (req.body.enableCoupon && req.body.couponCode && req.body.couponDiscountPercentage) {
      try {
        await db.createCoupon({
          code: String(req.body.couponCode).toUpperCase().trim(),
          ebookId: newEbook.id,
          discountPercentage: Number(req.body.couponDiscountPercentage),
          expiresAt: req.body.couponExpiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3).toISOString(),
          unlimitedUsage: Boolean(req.body.couponUnlimited),
          usageLimit: Number(req.body.couponUsageLimit) || 100,
          isActive: true
        });
      } catch (couponErr) {
        console.warn("Inline coupon creation note:", couponErr);
      }
    }
    const reloaded = await db.findEbookById(newEbook.id);
    return res.status(201).json({ ebook: reloaded || newEbook, message: "Publication created successfully" });
  } catch (err) {
    console.error("Create ebook error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to create publication" });
  }
});
router6.put("/ebooks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.findEbookById(id);
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook not found" });
    }
    const updates = { ...req.body };
    if (updates.price !== void 0) {
      updates.price = Number(updates.price);
    }
    if (updates.totalOriginalValue !== void 0) {
      updates.totalOriginalValue = Number(updates.totalOriginalValue);
    }
    if (updates.pageCount !== void 0) {
      updates.pageCount = Number(updates.pageCount);
    }
    if (updates.title && updates.title !== existing.title) {
      updates.slug = `${slugify(updates.title)}-${id.slice(-4)}`;
    }
    if (updates.hasBonus !== void 0) {
      updates.hasBonus = Boolean(updates.hasBonus);
    }
    if (updates.publicationType) {
      updates.publicationType = updates.publicationType === "COMBO" ? "COMBO" : "SINGLE";
    }
    if (Array.isArray(updates.comboItems)) {
      const cleanComboItems = [];
      for (let idx = 0; idx < updates.comboItems.length; idx++) {
        const raw = updates.comboItems[idx];
        const isCatalog = raw.sourceType === "catalog" || raw.ebookId && !raw.sourceType && raw.ebookId !== id;
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanComboItems.push({
              id: raw.id || `citem-${Date.now()}-${idx}`,
              sourceType: "catalog",
              ebookId: catalogBook.id,
              title: catalogBook.title,
              author: catalogBook.author,
              category: catalogBook.category,
              description: catalogBook.description,
              price: catalogBook.price,
              pageCount: catalogBook.pageCount,
              fileSize: catalogBook.fileSize,
              coverImageUrl: catalogBook.coverImageUrl,
              pdfUrl: catalogBook.pdfUrl
            });
            continue;
          }
        }
        const customSlug = `${slugify(raw.title || "volume")}-${Date.now().toString().slice(-4)}`;
        let customEbookId = raw.ebookId;
        if (customEbookId) {
          const existingCustom = await db.findEbookById(customEbookId);
          if (existingCustom) {
            await db.updateEbook(customEbookId, {
              title: (raw.title || existingCustom.title).trim(),
              author: (raw.author || existingCustom.author || updates.author || existing.author || "Author").trim(),
              category: (raw.category || existingCustom.category || updates.category || existing.category || "General").trim(),
              description: (raw.description || existingCustom.description).trim(),
              price: raw.price !== void 0 ? Number(raw.price) : existingCustom.price,
              coverImageUrl: raw.coverImageUrl || existingCustom.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingCustom.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingCustom.pageCount,
              fileSize: raw.fileSize || existingCustom.fileSize
            });
          } else {
            customEbookId = void 0;
          }
        }
        if (!customEbookId) {
          const created = await db.createEbook({
            title: (raw.title || "Custom Volume").trim(),
            slug: customSlug,
            description: (raw.description || "Custom volume in combo.").trim(),
            author: (raw.author || updates.author || existing.author || "Editorial Staff").trim(),
            category: (raw.category || updates.category || existing.category || "Technology & Engineering").trim(),
            price: raw.price !== void 0 ? Number(raw.price) : 399,
            currency: updates.currency || existing.currency || "INR",
            publicationType: "SINGLE",
            coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80",
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 150,
            fileSize: raw.fileSize || "10 MB",
            featured: false,
            published: false
          });
          customEbookId = created.id;
        }
        cleanComboItems.push({
          id: raw.id || `citem-${Date.now()}-${idx}`,
          sourceType: "custom",
          ebookId: customEbookId,
          title: (raw.title || "Untitled Volume").trim(),
          author: (raw.author || updates.author || existing.author || "Author").trim(),
          category: (raw.category || updates.category || existing.category || "General").trim(),
          description: (raw.description || "").trim(),
          price: raw.price !== void 0 ? Number(raw.price) : 399,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 150,
          fileSize: raw.fileSize || "10 MB",
          coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName
        });
      }
      updates.comboItems = cleanComboItems;
    }
    if (Array.isArray(updates.bonusItems)) {
      const cleanBonusItems = [];
      for (let idx = 0; idx < updates.bonusItems.length; idx++) {
        const raw = updates.bonusItems[idx];
        const isCatalog = raw.sourceType === "existing" || raw.sourceType === "catalog";
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanBonusItems.push({
              id: raw.id || `bitem-${Date.now()}-${idx}`,
              sourceType: "existing",
              ebookId: catalogBook.id,
              title: catalogBook.title,
              author: catalogBook.author,
              category: catalogBook.category,
              description: catalogBook.description || "Included free as a bonus companion edition.",
              coverImageUrl: catalogBook.coverImageUrl,
              pdfUrl: catalogBook.pdfUrl,
              pageCount: catalogBook.pageCount,
              fileSize: catalogBook.fileSize,
              price: catalogBook.price
            });
            continue;
          }
        }
        const customSlug = `${slugify(raw.title || "bonus-guide")}-${Date.now().toString().slice(-4)}`;
        let customBonusEbookId = raw.ebookId;
        if (customBonusEbookId) {
          const existingBonus = await db.findEbookById(customBonusEbookId);
          if (existingBonus) {
            await db.updateEbook(customBonusEbookId, {
              title: (raw.title || existingBonus.title).trim(),
              author: (raw.author || existingBonus.author || updates.author || existing.author || "Author").trim(),
              category: (raw.category || existingBonus.category || updates.category || existing.category || "General").trim(),
              description: (raw.description || existingBonus.description).trim(),
              price: raw.price !== void 0 ? Number(raw.price) : existingBonus.price,
              coverImageUrl: raw.coverImageUrl || existingBonus.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingBonus.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingBonus.pageCount,
              fileSize: raw.fileSize || existingBonus.fileSize
            });
          } else {
            customBonusEbookId = void 0;
          }
        }
        if (!customBonusEbookId) {
          const created = await db.createEbook({
            title: (raw.title || "Bonus Companion Guide").trim(),
            slug: customSlug,
            description: (raw.description || "Exclusive digital companion guide.").trim(),
            author: (raw.author || updates.author || existing.author || "Editorial Staff").trim(),
            category: (raw.category || updates.category || existing.category || "General").trim(),
            price: raw.price !== void 0 ? Number(raw.price) : 299,
            currency: updates.currency || existing.currency || "INR",
            publicationType: "SINGLE",
            coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 50,
            fileSize: raw.fileSize || "5.0 MB",
            featured: false,
            published: false
          });
          customBonusEbookId = created.id;
        }
        cleanBonusItems.push({
          id: raw.id || `bitem-${Date.now()}-${idx}`,
          sourceType: "custom",
          ebookId: customBonusEbookId,
          title: (raw.title || "Untitled Bonus Volume").trim(),
          author: (raw.author || updates.author || existing.author || "Author").trim(),
          category: (raw.category || updates.category || existing.category || "General").trim(),
          description: (raw.description || "").trim(),
          coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 50,
          fileSize: raw.fileSize || "5.0 MB",
          price: raw.price !== void 0 ? Number(raw.price) : 299
        });
      }
      updates.bonusItems = cleanBonusItems;
      if (updates.bonusItems.length > 0) {
        updates.hasBonus = true;
      }
    }
    const updated = await db.updateEbook(id, updates);
    if (req.body.enableCoupon && req.body.couponCode && req.body.couponDiscountPercentage) {
      const formattedCode = String(req.body.couponCode).toUpperCase().trim();
      const existingCoupons = await db.getCouponsByEbookId(id);
      const existingForEbook = existingCoupons.find((c) => c.code.toUpperCase() === formattedCode || c.id === req.body.couponId);
      if (existingForEbook) {
        await db.updateCoupon(existingForEbook.id, {
          code: formattedCode,
          discountPercentage: Number(req.body.couponDiscountPercentage),
          expiresAt: req.body.couponExpiresAt || existingForEbook.expiresAt,
          unlimitedUsage: Boolean(req.body.couponUnlimited),
          usageLimit: Number(req.body.couponUsageLimit) || existingForEbook.usageLimit,
          isActive: true
        });
      } else {
        try {
          await db.createCoupon({
            code: formattedCode,
            ebookId: id,
            discountPercentage: Number(req.body.couponDiscountPercentage),
            expiresAt: req.body.couponExpiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3).toISOString(),
            unlimitedUsage: Boolean(req.body.couponUnlimited),
            usageLimit: Number(req.body.couponUsageLimit) || 100,
            isActive: true
          });
        } catch (couponErr) {
          console.warn("Inline coupon creation note:", couponErr);
        }
      }
    }
    const reloaded = await db.findEbookById(id);
    return res.json({ ebook: reloaded || updated, message: "Publication updated successfully" });
  } catch (err) {
    console.error("Update ebook error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update publication" });
  }
});
router6.delete("/ebooks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteEbook(id);
    if (!deleted) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook not found" });
    }
    return res.json({ success: true, message: "Ebook deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to delete ebook" });
  }
});
router6.patch("/ebooks/:id/toggle-publish", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.findEbookById(id);
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook not found" });
    }
    const updated = await db.updateEbook(id, { published: !existing.published });
    return res.json({ ebook: updated, message: `Ebook ${updated?.published ? "published" : "unpublished"}` });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to toggle publish state" });
  }
});
router6.patch("/ebooks/:id/toggle-featured", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.findEbookById(id);
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Ebook not found" });
    }
    const updated = await db.updateEbook(id, { featured: !existing.featured });
    return res.json({ ebook: updated, message: `Ebook ${updated?.featured ? "marked as featured" : "removed from featured"}` });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to toggle featured status" });
  }
});
router6.get("/purchases", async (req, res) => {
  try {
    const { status, search } = req.query;
    const purchases = await db.getAllPurchases({
      status: typeof status === "string" ? status : void 0,
      search: typeof search === "string" ? search : void 0
    });
    return res.json({ purchases });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch purchases" });
  }
});
router6.get("/coupons", async (req, res) => {
  try {
    const { ebookId, activeOnly, search } = req.query;
    const coupons = await db.getAllCoupons({
      ebookId: typeof ebookId === "string" ? ebookId : void 0,
      activeOnly: activeOnly === "true",
      search: typeof search === "string" ? search : void 0
    });
    return res.json({ coupons });
  } catch (err) {
    console.error("Fetch coupons error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch coupons" });
  }
});
router6.get("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await db.findCouponById(id);
    if (!coupon) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Coupon not found" });
    }
    return res.json({ coupon });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch coupon" });
  }
});
router6.post("/coupons", async (req, res) => {
  try {
    const { code, ebookId, discountPercentage, expiresAt, usageLimit, unlimitedUsage, isActive } = req.body;
    if (!code || !ebookId || discountPercentage === void 0) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Coupon code, applicable ebook, and discount percentage are required"
      });
    }
    const ebook = await db.findEbookById(ebookId);
    if (!ebook) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Selected ebook does not exist" });
    }
    const numDiscount = Number(discountPercentage);
    if (isNaN(numDiscount) || numDiscount <= 0 || numDiscount > 100) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message: "Discount percentage must be a number between 1 and 100"
      });
    }
    const isUnlimited = Boolean(unlimitedUsage);
    const limit = isUnlimited ? 0 : Number(usageLimit) || 100;
    const coupon = await db.createCoupon({
      code: String(code).toUpperCase().trim(),
      ebookId,
      discountPercentage: numDiscount,
      expiresAt: expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3).toISOString(),
      usageLimit: limit,
      unlimitedUsage: isUnlimited,
      isActive: isActive !== void 0 ? Boolean(isActive) : true
    });
    return res.status(201).json({ coupon, message: "Coupon created successfully" });
  } catch (err) {
    console.error("Create coupon error:", err);
    return res.status(400).json({ error: "COUPON_CREATE_FAILED", message: err.message || "Failed to create coupon" });
  }
});
router6.put("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.findCouponById(id);
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Coupon not found" });
    }
    const updates = { ...req.body };
    if (updates.code) {
      updates.code = String(updates.code).toUpperCase().trim();
    }
    if (updates.discountPercentage !== void 0) {
      updates.discountPercentage = Math.min(100, Math.max(1, Number(updates.discountPercentage)));
    }
    if (updates.usageLimit !== void 0) {
      updates.usageLimit = Number(updates.usageLimit);
    }
    if (updates.unlimitedUsage !== void 0) {
      updates.unlimitedUsage = Boolean(updates.unlimitedUsage);
      if (updates.unlimitedUsage) {
        updates.usageLimit = 0;
      }
    }
    const updated = await db.updateCoupon(id, updates);
    return res.json({ coupon: updated, message: "Coupon updated successfully" });
  } catch (err) {
    console.error("Update coupon error:", err);
    return res.status(400).json({ error: "COUPON_UPDATE_FAILED", message: err.message || "Failed to update coupon" });
  }
});
router6.delete("/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteCoupon(id);
    if (!deleted) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Coupon not found" });
    }
    return res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to delete coupon" });
  }
});
router6.patch("/coupons/:id/toggle-active", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.findCouponById(id);
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Coupon not found" });
    }
    const updated = await db.updateCoupon(id, { isActive: !existing.isActive });
    return res.json({
      coupon: updated,
      message: `Coupon ${updated?.isActive ? "activated" : "deactivated"} successfully`
    });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to toggle coupon status" });
  }
});
router6.get("/users", async (req, res) => {
  try {
    const users = await db.getAllUsers();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch users" });
  }
});
router6.patch("/users/:id/toggle-active", async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.user.id;
    if (id === currentAdminId) {
      return res.status(400).json({
        error: "CANNOT_DEACTIVATE_SELF",
        message: "Security protection: You cannot deactivate your own administrative account."
      });
    }
    const user = await db.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: "NOT_FOUND", message: "User not found" });
    }
    const updatedUser = await db.updateUser(id, { isActive: !user.isActive });
    return res.json({
      user: updatedUser,
      message: `User account ${updatedUser?.isActive ? "activated" : "deactivated"} successfully`
    });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update user status" });
  }
});
router6.get("/categories", async (req, res) => {
  try {
    const { activeOnly, search } = req.query;
    const categories = await db.getAllCategories({
      activeOnly: activeOnly === "true",
      search: typeof search === "string" ? search : void 0
    });
    return res.json({ categories });
  } catch (err) {
    console.error("Fetch categories error:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch categories" });
  }
});
router6.get("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await db.findCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Category not found" });
    }
    return res.json({ category });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to fetch category" });
  }
});
router6.post("/categories", async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "VALIDATION_ERROR", message: "Category name is required" });
    }
    const category = await db.createCategory({
      name: name.trim(),
      description: description?.trim(),
      isActive: isActive !== void 0 ? Boolean(isActive) : true
    });
    return res.status(201).json({ category, message: "Category created successfully" });
  } catch (err) {
    return res.status(400).json({ error: "CATEGORY_CREATE_FAILED", message: err.message || "Failed to create category" });
  }
});
router6.put("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const existing = await db.findCategoryById(id);
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Category not found" });
    }
    const updates = {};
    if (name !== void 0) updates.name = name.trim();
    if (description !== void 0) updates.description = description.trim();
    if (isActive !== void 0) updates.isActive = Boolean(isActive);
    const updated = await db.updateCategory(id, updates);
    return res.json({ category: updated, message: "Category updated successfully" });
  } catch (err) {
    return res.status(400).json({ error: "CATEGORY_UPDATE_FAILED", message: err.message || "Failed to update category" });
  }
});
router6.delete("/categories/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === "true";
    const result = await db.deleteCategory(id, force);
    if (!result.success) {
      return res.status(404).json({ error: "NOT_FOUND", message: result.message || "Category not found" });
    }
    return res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    return res.status(400).json({ error: "CATEGORY_DELETE_FAILED", message: err.message || "Failed to delete category" });
  }
});
router6.patch("/categories/:id/toggle-active", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.findCategoryById(id);
    if (!existing) {
      return res.status(404).json({ error: "NOT_FOUND", message: "Category not found" });
    }
    const updated = await db.toggleCategoryActive(id);
    return res.json({
      category: updated,
      message: `Category ${updated?.isActive ? "activated" : "deactivated"} successfully`
    });
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to toggle category status" });
  }
});
var admin_default = router6;

// server/routes/upload.ts
var import_express7 = require("express");
var import_multer = __toESM(require("multer"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_cloudinary = require("cloudinary");
var router7 = (0, import_express7.Router)();
var UPLOADS_DIR = import_path2.default.join(process.cwd(), "uploads");
var COVERS_DIR = import_path2.default.join(UPLOADS_DIR, "covers");
var PDFS_DIR = import_path2.default.join(UPLOADS_DIR, "pdfs");
try {
  [UPLOADS_DIR, COVERS_DIR, PDFS_DIR].forEach((dir) => {
    if (!import_fs2.default.existsSync(dir)) {
      import_fs2.default.mkdirSync(dir, { recursive: true });
    }
  });
} catch (err) {
  console.warn("Could not create upload directories (read-only filesystem?):", err);
}
var storage = import_multer.default.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, COVERS_DIR);
    } else {
      cb(null, PDFS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = import_path2.default.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});
var upload = (0, import_multer.default)({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }
  // 50MB
});
var isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET && !process.env.CLOUDINARY_CLOUD_NAME.includes("sample")
);
if (isCloudinaryConfigured) {
  import_cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}
router7.post("/file", authMiddleware, adminMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "NO_FILE", message: "No file was uploaded" });
    }
    const isImage = req.file.mimetype.startsWith("image/");
    const localRelativePath = isImage ? `/uploads/covers/${req.file.filename}` : `/uploads/pdfs/${req.file.filename}`;
    if (isCloudinaryConfigured) {
      try {
        const folder = isImage ? "ebooks/covers" : "ebooks/pdfs";
        const resourceType = isImage ? "image" : "raw";
        const result = await import_cloudinary.v2.uploader.upload(req.file.path, {
          folder,
          resource_type: resourceType
        });
        return res.json({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
          filename: req.file.originalname
        });
      } catch (cloudErr) {
        console.warn("Cloudinary upload fallback to local storage:", cloudErr);
      }
    }
    return res.json({
      url: localRelativePath,
      publicId: req.file.filename,
      resourceType: isImage ? "image" : "raw",
      fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
      filename: req.file.originalname
    });
  } catch (err) {
    console.error("File upload error:", err);
    return res.status(500).json({ error: "UPLOAD_FAILED", message: err.message || "File upload failed" });
  }
});
var upload_default = router7;

// api/index.ts
import_dotenv2.default.config();
var app = (0, import_express8.default)();
app.use(import_express8.default.json({ limit: "20mb" }));
app.use(import_express8.default.urlencoded({ extended: true, limit: "20mb" }));
var uploadsDir = import_path3.default.join(process.cwd(), "uploads");
app.use("/uploads", import_express8.default.static(uploadsDir));
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Ebook Store API",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.use("/api/auth", auth_default);
app.use("/api/ebooks", download_default);
app.use("/api/ebooks", ebooks_default);
app.use("/api/payments", payments_default);
app.use("/api/user", user_default);
app.use("/api/admin", admin_default);
app.use("/api/upload", upload_default);
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "NOT_FOUND", message: "API route not found" });
});
var distPath = import_path3.default.join(process.cwd(), "dist");
if (import_fs3.default.existsSync(distPath)) {
  app.use(import_express8.default.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(import_path3.default.join(distPath, "index.html"));
  });
}
var index_default = app;
//# sourceMappingURL=index.js.map
