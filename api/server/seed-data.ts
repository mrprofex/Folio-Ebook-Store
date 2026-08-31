import bcrypt from 'bcryptjs';
import { User, Ebook, Category, Coupon, Purchase, CouponUsage } from '../src/types/index';

// Initial Sample Categories
export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-01',
    name: 'Technology & Engineering',
    slug: 'technology-engineering',
    description: 'System design, full-stack development, cloud architecture, and modern devops.',
    isActive: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'cat-02',
    name: 'Typography & Design',
    slug: 'typography-design',
    description: 'Editorial layouts, spatial systems, UI craft, typography, and design systems.',
    isActive: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'cat-03',
    name: 'Business & Strategy',
    slug: 'business-strategy',
    description: 'Lean startups, bootstrap growth, pricing frameworks, and scalable business models.',
    isActive: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'cat-04',
    name: 'Philosophy & Mindset',
    slug: 'philosophy-mindset',
    description: 'Stoicism, critical reasoning, mental models, decision making, and deep focus.',
    isActive: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'cat-05',
    name: 'Creative Writing',
    slug: 'creative-writing',
    description: 'Storycraft, editorial narrative, memoirs, pacing, and publishing fundamentals.',
    isActive: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'cat-06',
    name: 'Arts & Architecture',
    slug: 'arts-architecture',
    description: 'Contemporary building, spatial aesthetics, materials, and physical design.',
    isActive: true,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z'
  }
];

// Initial Sample Ebooks with rich descriptions and beautiful covers
export const INITIAL_EBOOKS: Ebook[] = [
  {
    id: 'ebk-combo-01',
    title: 'Full-Stack & Cloud Architecture Master Combo (3-in-1 Edition)',
    slug: 'full-stack-cloud-architecture-master-combo',
    description: 'The ultimate professional bundle containing "The Art of Modern Architecture & Systems", "Full-Stack TypeScript & Cloud Native Patterns", plus the exclusive "Distributed Cloud Incident Response Playbook".',
    author: 'Eleanor Vance & Devon Hayes',
    category: 'Technology & Engineering',
    price: 899,
    currency: 'INR',
    publicationType: 'COMBO',
    totalOriginalValue: 1648,
    coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=900&q=80',
    pdfUrl: '/api/ebooks/ebk-combo-01/pdf-content',
    fileSize: '45.2 MB',
    pageCount: 836,
    featured: true,
    published: true,
    downloadCount: 88,
    sampleChapter: 'Master Combo Synopsis: Comprehensive coverage of high-scale system design, microservices, TypeScript architectural patterns, and production site reliability engineering.',
    comboItems: [
      {
        id: 'citem-1',
        title: 'The Art of Modern Architecture & Systems',
        author: 'Eleanor Vance, Principal Architect',
        description: 'Scalable, resilient distributed systems and event-driven backends.',
        price: 499,
        pageCount: 342,
        fileSize: '14.8 MB',
        coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
        pdfUrl: '/api/ebooks/ebk-01/pdf-content',
        ebookId: 'ebk-01'
      },
      {
        id: 'citem-2',
        title: 'Full-Stack TypeScript & Cloud Native Patterns',
        author: 'Devon Hayes & Priya Sharma',
        description: 'Type safety, edge computing, serverless APIs, and automated pipelines.',
        price: 649,
        pageCount: 410,
        fileSize: '18.5 MB',
        coverImageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=900&q=80',
        pdfUrl: '/api/ebooks/ebk-05/pdf-content',
        ebookId: 'ebk-05'
      },
      {
        id: 'citem-3',
        title: 'Distributed Cloud Incident Response Playbook',
        author: 'Devon Hayes',
        description: 'Interactive blueprints, rollback procedures, and SRE runbooks.',
        price: 500,
        pageCount: 84,
        fileSize: '11.9 MB',
        coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
        pdfUrl: '/api/ebooks/ebk-combo-01/citem-3/pdf-content'
      }
    ],
    hasBonus: true,
    bonusType: 'custom',
    bonusTitle: '50 Production System Design Architecture Diagram Templates (SVG & Figma)',
    bonusDescription: 'Vector system design diagrams covering message brokers, cache invalidation topologies, and auth flows.',
    bonusCoverImageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    bonusPdfUrl: '/api/ebooks/ebk-combo-01/bonus-content',
    bonusPageCount: 50,
    bonusFileSize: '7.2 MB',
    createdAt: '2026-06-10T10:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z'
  },
  {
    id: 'ebk-01',
    title: 'The Art of Modern Architecture & Systems',
    slug: 'the-art-of-modern-architecture-and-systems',
    description: 'A definitive guide to designing scalable, resilient distributed systems, microservices, and event-driven backends for high-traffic modern web platforms.',
    author: 'Eleanor Vance, Principal Architect',
    category: 'Technology & Engineering',
    price: 499,
    currency: 'INR',
    publicationType: 'SINGLE',
    coverImageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80',
    pdfUrl: '/api/ebooks/ebk-01/pdf-content',
    fileSize: '14.8 MB',
    pageCount: 342,
    featured: true,
    published: true,
    downloadCount: 142,
    sampleChapter: 'Chapter 1: The Core Tenets of Resilient Software. In this chapter we dissect fault tolerance, circuit breakers, and bounded contexts...',
    hasBonus: true,
    bonusType: 'custom',
    bonusTitle: '100 Production Checklists & Incident Runbooks',
    bonusDescription: 'Battle-tested checklists for zero-downtime schema migrations, distributed tracing setup, and latency mitigation protocols.',
    bonusCoverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    bonusPdfUrl: '/api/ebooks/ebk-01/bonus-content',
    bonusPageCount: 68,
    bonusFileSize: '4.5 MB',
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z'
  },
  {
    id: 'ebk-02',
    title: 'Typography & Editorial Spatial Design',
    slug: 'typography-and-editorial-spatial-design',
    description: 'Master typographic rhythm, visual hierarchy, grid systems, and micro-interactions for digital editorial products and high-craft web experiences.',
    author: 'Julian Moreau',
    category: 'Design & Craft',
    price: 349,
    currency: 'INR',
    coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
    pdfUrl: '/api/ebooks/ebk-02/pdf-content',
    fileSize: '22.1 MB',
    pageCount: 280,
    featured: true,
    published: true,
    downloadCount: 98,
    sampleChapter: 'Chapter 1: The Mathematical Proportions of Type. How baseline grids harmonize with fluid viewport calculations...',
    hasBonus: false,
    createdAt: '2026-07-02T14:30:00.000Z',
    updatedAt: '2026-08-10T16:00:00.000Z'
  },
  {
    id: 'ebk-03',
    title: 'Zero to One Million: The Lean Product Playbook',
    slug: 'zero-to-one-million-the-lean-product-playbook',
    description: 'Battle-tested frameworks for bootstrapping, finding true product-market fit, and scaling subscription revenue without outside venture capital.',
    author: 'Siddharth Mehta',
    category: 'Business & Startups',
    price: 599,
    currency: 'INR',
    coverImageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=900&q=80',
    pdfUrl: '/api/ebooks/ebk-03/pdf-content',
    fileSize: '9.4 MB',
    pageCount: 215,
    featured: true,
    published: true,
    downloadCount: 210,
    sampleChapter: 'Chapter 1: The Customer Discovery Engine. Why 90% of early feature requests are misleading and how to filter signal from noise...',
    hasBonus: true,
    bonusType: 'existing',
    bonusEbookId: 'ebk-04',
    bonusTitle: 'The Solitary Thinker: Philosophy for the Modern Mind',
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-07-28T11:00:00.000Z'
  },
  {
    id: 'ebk-04',
    title: 'The Solitary Thinker: Philosophy for the Modern Mind',
    slug: 'the-solitary-thinker-philosophy-for-the-modern-mind',
    description: 'An exploration of stoic discipline, deep focus, and timeless cognitive models to navigate noise, anxiety, and distraction in the hyper-connected era.',
    author: 'Marcus Sterling',
    category: 'Philosophy & Mindset',
    price: 299,
    currency: 'INR',
    coverImageUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=900&q=80',
    pdfUrl: '/api/ebooks/ebk-04/pdf-content',
    fileSize: '6.2 MB',
    pageCount: 190,
    featured: false,
    published: true,
    downloadCount: 75,
    sampleChapter: 'Chapter 1: The Geometry of Solitude. Cultivating an inner citadel capable of sustained creative clarity...',
    hasBonus: false,
    createdAt: '2026-07-10T09:15:00.000Z',
    updatedAt: '2026-08-15T10:00:00.000Z'
  },
  {
    id: 'ebk-05',
    title: 'Full-Stack TypeScript & Cloud Native Patterns',
    slug: 'full-stack-typescript-and-cloud-native-patterns',
    description: 'End-to-end guide to type safety, edge computing, serverless APIs, database transactions, and automated deployment pipelines in TypeScript.',
    author: 'Devon Hayes & Priya Sharma',
    category: 'Technology & Engineering',
    price: 649,
    currency: 'INR',
    coverImageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=900&q=80',
    pdfUrl: '/api/ebooks/ebk-05/pdf-content',
    fileSize: '18.5 MB',
    pageCount: 410,
    featured: true,
    published: true,
    downloadCount: 165,
    sampleChapter: 'Chapter 1: Advanced Generics and Runtime Validation. Bridging static type checks with schema validation at network boundaries...',
    hasBonus: true,
    bonusType: 'custom',
    bonusTitle: '50 TypeScript Micro-Design Patterns & AST Recipes',
    bonusDescription: 'Practical utility types, compiler plugin snippets, and zero-runtime abstraction patterns.',
    bonusCoverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    bonusPdfUrl: '/api/ebooks/ebk-05/bonus-content',
    bonusPageCount: 84,
    bonusFileSize: '5.8 MB',
    createdAt: '2026-06-25T11:00:00.000Z',
    updatedAt: '2026-08-20T14:00:00.000Z'
  },
  {
    id: 'ebk-06',
    title: 'Writing That Resonates: The Non-Fiction Craft',
    slug: 'writing-that-resonates-the-non-fiction-craft',
    description: 'Learn how to distill complex technical and academic ideas into clear, persuasive, and magnetic prose that captures reader attention.',
    author: 'Clara Oswald',
    category: 'Creative Writing',
    price: 399,
    currency: 'INR',
    coverImageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=900&q=80',
    pdfUrl: '/api/ebooks/ebk-06/pdf-content',
    fileSize: '8.1 MB',
    pageCount: 228,
    featured: false,
    published: true,
    downloadCount: 62,
    sampleChapter: 'Chapter 1: Hooking the Intellect. Structuring thesis statements that demand resolution...',
    hasBonus: false,
    createdAt: '2026-07-18T13:45:00.000Z',
    updatedAt: '2026-08-22T09:30:00.000Z'
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'cpn-01',
    code: 'SAVE20',
    ebookId: 'ebk-01',
    discountPercentage: 20,
    expiresAt: '2026-12-31T23:59:59.000Z',
    usageLimit: 100,
    usageCount: 14,
    unlimitedUsage: false,
    isActive: true,
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-08-01T12:00:00.000Z'
  },
  {
    id: 'cpn-02',
    code: 'LAUNCH30',
    ebookId: 'ebk-03',
    discountPercentage: 30,
    expiresAt: '2026-12-31T23:59:59.000Z',
    usageLimit: 0,
    usageCount: 28,
    unlimitedUsage: true,
    isActive: true,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-07-28T11:00:00.000Z'
  },
  {
    id: 'cpn-03',
    code: 'SPECIAL50',
    ebookId: 'ebk-05',
    discountPercentage: 50,
    expiresAt: '2026-11-30T23:59:59.000Z',
    usageLimit: 50,
    usageCount: 8,
    unlimitedUsage: false,
    isActive: true,
    createdAt: '2026-06-25T11:00:00.000Z',
    updatedAt: '2026-08-20T14:00:00.000Z'
  },
  {
    id: 'cpn-04',
    code: 'EXPIRED10',
    ebookId: 'ebk-02',
    discountPercentage: 10,
    expiresAt: '2025-01-01T00:00:00.000Z',
    usageLimit: 100,
    usageCount: 25,
    unlimitedUsage: false,
    isActive: true,
    createdAt: '2024-11-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
];

// Seed users (passwords hashed at migration time)
export interface SeedUser extends User {
  passwordHash: string;
}

export function buildSeedUsers(adminEmail: string, adminPassword: string): SeedUser[] {
  const adminHash = bcrypt.hashSync(adminPassword, 10);
  const demoHash = bcrypt.hashSync('Password123!', 10);

  return [
    {
      id: 'usr-admin-01',
      name: 'Store Administrator',
      email: adminEmail.toLowerCase().trim(),
      passwordHash: adminHash,
      role: 'ADMIN',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'usr-demo-01',
      name: 'Alex Reader',
      email: 'alex@reader.com',
      passwordHash: demoHash,
      role: 'USER',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
      isActive: true
    }
  ];
}

export function buildDemoPurchases(): Purchase[] {
  return [
    {
      id: 'pur-101',
      userId: 'usr-demo-01',
      ebookId: 'ebk-01',
      originalAmount: 499,
      discountAmount: 99.8,
      amount: 399.2,
      finalAmount: 399.2,
      currency: 'INR',
      razorpayOrderId: 'order_seed_101',
      razorpayPaymentId: 'pay_seed_101',
      razorpaySignature: 'sig_verified_seed_101',
      paymentStatus: 'SUCCESS',
      couponId: 'cpn-01',
      couponCodeSnapshot: 'SAVE20',
      hasBonus: true,
      bonusTitle: '100 Production Checklists & Incident Runbooks',
      bonusCoverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
      bonusDownloadCount: 1,
      purchasedAt: '2026-08-10T14:22:00.000Z',
      downloadCount: 3,
      lastDownloadedAt: '2026-08-20T10:15:00.000Z'
    },
    {
      id: 'pur-102',
      userId: 'usr-demo-01',
      ebookId: 'ebk-03',
      originalAmount: 599,
      discountAmount: 179.7,
      amount: 419.3,
      finalAmount: 419.3,
      currency: 'INR',
      razorpayOrderId: 'order_seed_102',
      razorpayPaymentId: 'pay_seed_102',
      razorpaySignature: 'sig_verified_seed_102',
      paymentStatus: 'SUCCESS',
      couponId: 'cpn-02',
      couponCodeSnapshot: 'LAUNCH30',
      hasBonus: true,
      bonusEbookId: 'ebk-04',
      bonusTitle: 'The Solitary Thinker: Philosophy for the Modern Mind',
      bonusDownloadCount: 0,
      purchasedAt: '2026-08-22T09:18:00.000Z',
      downloadCount: 1,
      lastDownloadedAt: '2026-08-22T09:20:00.000Z'
    }
  ];
}

export function buildDemoUsages(): CouponUsage[] {
  return [
    {
      id: 'usg-01',
      couponId: 'cpn-01',
      userId: 'usr-demo-01',
      purchaseId: 'pur-101',
      usedAt: '2026-08-10T14:22:00.000Z'
    },
    {
      id: 'usg-02',
      couponId: 'cpn-02',
      userId: 'usr-demo-01',
      purchaseId: 'pur-102',
      usedAt: '2026-08-22T09:18:00.000Z'
    }
  ];
}
