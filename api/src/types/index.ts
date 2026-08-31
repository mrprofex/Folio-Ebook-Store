export type Role = 'USER' | 'ADMIN';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type PublicationType = 'SINGLE' | 'COMBO';

export type EntitlementType = 'PURCHASED' | 'COMBO_INCLUDED' | 'BONUS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  ebookCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ComboItem {
  id: string;
  sourceType?: 'catalog' | 'custom';
  title: string;
  author: string;
  category?: string;
  description?: string;
  price?: number;
  pageCount?: number;
  fileSize?: string;
  coverImageUrl?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  ebookId?: string; // If linked to an existing catalog ebook
  sampleChapter?: string;
}

export interface BonusItem {
  id: string;
  sourceType?: 'existing' | 'custom' | 'catalog';
  title: string;
  author?: string;
  category?: string;
  description?: string;
  price?: number;
  coverImageUrl?: string;
  pdfUrl?: string;
  pdfFileName?: string;
  pageCount?: number;
  fileSize?: string;
  ebookId?: string; // If linked to an existing catalog ebook
}

export interface AccessEntitlement {
  id: string;
  itemId: string;
  title: string;
  author: string;
  description?: string;
  coverImageUrl: string;
  pdfUrl?: string;
  pageCount?: number;
  fileSize?: string;
  type: EntitlementType;
  parentEbookId: string;
  parentTitle: string;
  downloadUrl: string;
}

export interface Coupon {
  id: string;
  code: string;
  ebookId: string;
  discountPercentage: number;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
  unlimitedUsage: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined for display
  ebook?: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    publicationType?: PublicationType;
  };
  totalRevenueGenerated?: number;
  totalDiscountGiven?: number;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  userId: string;
  purchaseId: string;
  usedAt: string;
}

export interface Ebook {
  id: string;
  title: string;
  slug: string;
  description: string;
  author: string;
  category: string;
  price: number;
  currency: string;
  coverImageUrl: string;
  coverPublicId?: string;
  pdfUrl: string;
  pdfPublicId?: string;
  cloudinaryResourceType?: string;
  fileSize: string;
  pageCount: number;
  featured: boolean;
  published: boolean;
  downloadCount: number;
  sampleChapter?: string;
  createdAt: string;
  updatedAt: string;

  // Publication Type (SINGLE vs COMBO)
  publicationType?: PublicationType;
  comboItems?: ComboItem[];
  totalOriginalValue?: number; // Sum of standalone item prices

  // Bonus Ebook / Companion Fields (Supports multiple bonus volumes)
  hasBonus?: boolean;
  bonusItems?: BonusItem[];
  bonusType?: 'existing' | 'custom';
  bonusEbookId?: string;
  bonusTitle?: string;
  bonusDescription?: string;
  bonusCoverImageUrl?: string;
  bonusPdfUrl?: string;
  bonusPageCount?: number;
  bonusFileSize?: string;

  // Joined / Populated helper fields
  bonusEbook?: {
    id: string;
    title: string;
    slug: string;
    coverImageUrl: string;
    author: string;
    price?: number;
    pageCount?: number;
    fileSize?: string;
    description?: string;
  };
  coupons?: Coupon[];
  activeCoupon?: Coupon;
}

export interface Purchase {
  id: string;
  userId: string;
  ebookId: string;
  amount: number; // Final amount paid
  originalAmount?: number; // Pre-discount price
  discountAmount?: number; // Total discount deducted
  finalAmount?: number; // Equals amount
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentStatus: PaymentStatus;
  purchasedAt: string;
  downloadCount: number;
  lastDownloadedAt?: string;

  // Publication & Combo snapshot
  publicationType?: PublicationType;
  comboItemsSnapshot?: ComboItem[];
  entitlements?: AccessEntitlement[];

  // Coupon snapshot
  couponId?: string;
  couponCodeSnapshot?: string;

  // Bonus snapshot & access (supports multiple bonus items)
  hasBonus?: boolean;
  bonusItemsSnapshot?: BonusItem[];
  bonusEbookId?: string;
  bonusTitle?: string;
  bonusCoverImageUrl?: string;
  bonusDownloadCount?: number;
  bonusLastDownloadedAt?: string;

  // Joined fields for display
  user?: {
    name: string;
    email: string;
  };
  ebook?: {
    title: string;
    slug: string;
    coverImageUrl: string;
    author: string;
    publicationType?: PublicationType;
    comboItems?: ComboItem[];
    hasBonus?: boolean;
    bonusTitle?: string;
    bonusCoverImageUrl?: string;
    bonusItems?: BonusItem[];
  };
}

export interface DashboardStats {
  totalEarnings: number;
  todayEarnings: number;
  totalPurchases: number;
  totalUsers: number;
  totalEbooks: number;
  activeCoupons: number;
  totalCouponUses: number;
  totalDiscountsGiven: number;
  recentPurchases: Purchase[];
  topSellingEbooks: {
    ebook: Ebook;
    salesCount: number;
    revenue: number;
  }[];
  revenueByMonth: {
    month: string;
    revenue: number;
    sales: number;
  }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ValidateCouponResponse {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discountPercentage: number;
    expiresAt: string;
    unlimitedUsage: boolean;
    remainingUses?: number;
  };
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  currency: string;
  message?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number; // in paise for Razorpay
  originalAmount: number; // in standard currency units
  discountAmount: number;
  finalAmount: number; // in standard currency units
  currency: string;
  keyId: string;
  ebookTitle: string;
  ebookId: string;
  userEmail: string;
  userName: string;
  isTestMode?: boolean;
  couponApplied?: {
    code: string;
    discountPercentage: number;
    discountAmount: number;
  };
  bonusIncluded?: {
    title: string;
    coverImageUrl?: string;
  };
}
