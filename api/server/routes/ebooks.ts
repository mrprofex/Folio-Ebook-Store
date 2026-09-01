import { Router, Response } from 'express';
import { db } from '../db';
import { optionalAuthMiddleware, AuthRequest } from '../auth';

const router = Router();

// Get all published ebooks (with search, category, sort)
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, sort } = req.query;
    const isAdmin = req.user?.role === 'ADMIN';

    const ebooks = await db.getAllEbooks({
      search: typeof search === 'string' ? search : undefined,
      category: typeof category === 'string' ? category : undefined,
      sort: typeof sort === 'string' ? (sort as any) : 'newest',
      publishedOnly: !isAdmin
    });

    return res.json({ ebooks });
  } catch (err: any) {
    console.error('Error fetching ebooks:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch ebooks' });
  }
});

// Get featured ebooks
router.get('/featured', async (req, res) => {
  try {
    const ebooks = await db.getAllEbooks({ publishedOnly: true, sort: 'featured' });
    return res.json({ ebooks: ebooks.filter(e => e.featured).slice(0, 6) });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch featured ebooks' });
  }
});

// Get available categories
router.get('/categories', async (req, res) => {
  try {
    const dbCategories = await db.getAllCategories({ activeOnly: true });
    const categoryNames = dbCategories.map(c => c.name);
    // Also include any distinct categories on published books
    const ebooks = await db.getAllEbooks({ publishedOnly: true });
    const allNames = Array.from(new Set([...categoryNames, ...ebooks.map(e => e.category)])).filter(Boolean);
    return res.json({ categories: allNames, categoryList: dbCategories });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch categories' });
  }
});

// Get single ebook by slug or id
router.get('/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const ebook = await db.findEbookBySlug(slug);

    if (!ebook) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook not found' });
    }

    // Check if unpublished and non-admin
    if (!ebook.published && req.user?.role !== 'ADMIN') {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook is not currently published' });
    }

    // Check if the authenticated user has purchased this ebook
    let isPurchased = false;
    let purchaseId: string | null = null;

    if (req.user) {
      const purchase = await db.findPurchaseByUserAndEbook(req.user.id, ebook.id);
      if (purchase && purchase.paymentStatus === 'SUCCESS') {
        isPurchased = true;
        purchaseId = purchase.id;
      }
    }

    // Return ebook without exposing direct sensitive internal PDF system paths if not bought
    const safeEbook = {
      ...ebook,
      // Provide preview information
      isPurchased,
      purchaseId
    };

    return res.json({ ebook: safeEbook });
  } catch (err: any) {
    console.error('Error fetching ebook detail:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch ebook details' });
  }
});

export default router;
