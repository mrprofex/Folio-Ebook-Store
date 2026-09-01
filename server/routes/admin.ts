import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../auth.js';

const router = Router();

// Apply auth + admin guard to all admin routes
router.use(authMiddleware as any);
router.use(adminMiddleware as any);

// Helper to generate a slug
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// 1. Dashboard Analytics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const stats = await db.getDashboardStats();
    return res.json({ stats });
  } catch (err: any) {
    console.error('Admin dashboard error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to compute dashboard metrics' });
  }
});

// 2. Ebook CRUD
router.get('/ebooks', async (req: AuthRequest, res: Response) => {
  try {
    const ebooks = await db.getAllEbooks({ publishedOnly: false });
    return res.json({ ebooks });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve ebooks' });
  }
});

router.get('/ebooks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ebook = await db.findEbookById(id) || await db.findEbookBySlug(id);
    if (!ebook) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook not found' });
    }
    return res.json({ ebook });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve ebook' });
  }
});

router.post('/ebooks', async (req: AuthRequest, res: Response) => {
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

    if (!title || !description || price === undefined || !coverImageUrl) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Title, description, price, and cover image are required'
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Price must be a valid positive number' });
    }

    let slug = slugify(title);
    // Ensure slug uniqueness
    const existing = await db.findEbookBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const cleanPublicationType = publicationType === 'COMBO' ? 'COMBO' : 'SINGLE';
    
    // Ensure all custom combo items and catalog combo items are real ebook references
    let cleanComboItems: any[] | undefined = undefined;
    if (Array.isArray(comboItems) && comboItems.length > 0) {
      cleanComboItems = [];
      for (let idx = 0; idx < comboItems.length; idx++) {
        const raw = comboItems[idx];
        const isCatalog = raw.sourceType === 'catalog' || (raw.ebookId && !raw.sourceType);
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanComboItems.push({
              id: raw.id || `citem-${Date.now()}-${idx}`,
              sourceType: 'catalog',
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
        // Custom volume: create or update real ebook record
        const customSlug = `${slugify(raw.title || 'volume')}-${Date.now().toString().slice(-4)}`;
        let customEbookId = raw.ebookId;
        if (customEbookId) {
          const existingCustom = await db.findEbookById(customEbookId);
          if (existingCustom) {
            await db.updateEbook(customEbookId, {
              title: (raw.title || existingCustom.title).trim(),
              author: (raw.author || existingCustom.author || author || 'Author').trim(),
              category: (raw.category || existingCustom.category || category || 'General').trim(),
              description: (raw.description || existingCustom.description).trim(),
              price: raw.price !== undefined ? Number(raw.price) : existingCustom.price,
              coverImageUrl: raw.coverImageUrl || existingCustom.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingCustom.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingCustom.pageCount,
              fileSize: raw.fileSize || existingCustom.fileSize
            });
          } else {
            customEbookId = undefined;
          }
        }
        if (!customEbookId) {
          const created = await db.createEbook({
            title: (raw.title || 'Custom Volume').trim(),
            slug: customSlug,
            description: (raw.description || 'Custom volume in combo.').trim(),
            author: (raw.author || author || 'Editorial Staff').trim(),
            category: (raw.category || category || 'Technology & Engineering').trim(),
            price: raw.price !== undefined ? Number(raw.price) : 399,
            currency: currency || 'INR',
            publicationType: 'SINGLE',
            coverImageUrl: raw.coverImageUrl || coverImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 150,
            fileSize: raw.fileSize || '10 MB',
            featured: false,
            published: false
          });
          customEbookId = created.id;
        }

        cleanComboItems.push({
          id: raw.id || `citem-${Date.now()}-${idx}`,
          sourceType: 'custom',
          ebookId: customEbookId,
          title: (raw.title || 'Untitled Volume').trim(),
          author: (raw.author || author || 'Author').trim(),
          category: (raw.category || category || 'General').trim(),
          description: (raw.description || '').trim(),
          price: raw.price !== undefined ? Number(raw.price) : 399,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 150,
          fileSize: raw.fileSize || '10 MB',
          coverImageUrl: raw.coverImageUrl || coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName
        });
      }
    }

    // Ensure all bonus items are real ebook references
    let cleanBonusItems: any[] | undefined = undefined;
    if (Array.isArray(req.body.bonusItems) && req.body.bonusItems.length > 0) {
      cleanBonusItems = [];
      for (let idx = 0; idx < req.body.bonusItems.length; idx++) {
        const raw = req.body.bonusItems[idx];
        const isCatalog = raw.sourceType === 'existing' || raw.sourceType === 'catalog';
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanBonusItems.push({
              id: raw.id || `bitem-${Date.now()}-${idx}`,
              sourceType: 'existing',
              ebookId: catalogBook.id,
              title: catalogBook.title,
              author: catalogBook.author,
              category: catalogBook.category,
              description: catalogBook.description || 'Included free as a bonus companion edition.',
              coverImageUrl: catalogBook.coverImageUrl,
              pdfUrl: catalogBook.pdfUrl,
              pageCount: catalogBook.pageCount,
              fileSize: catalogBook.fileSize,
              price: catalogBook.price
            });
            continue;
          }
        }
        // Custom bonus: create or update real ebook record
        const customSlug = `${slugify(raw.title || 'bonus-guide')}-${Date.now().toString().slice(-4)}`;
        let customBonusEbookId = raw.ebookId;
        if (customBonusEbookId) {
          const existingBonus = await db.findEbookById(customBonusEbookId);
          if (existingBonus) {
            await db.updateEbook(customBonusEbookId, {
              title: (raw.title || existingBonus.title).trim(),
              author: (raw.author || existingBonus.author || author || 'Author').trim(),
              category: (raw.category || existingBonus.category || category || 'General').trim(),
              description: (raw.description || existingBonus.description).trim(),
              price: raw.price !== undefined ? Number(raw.price) : existingBonus.price,
              coverImageUrl: raw.coverImageUrl || existingBonus.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingBonus.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingBonus.pageCount,
              fileSize: raw.fileSize || existingBonus.fileSize
            });
          } else {
            customBonusEbookId = undefined;
          }
        }
        if (!customBonusEbookId) {
          const created = await db.createEbook({
            title: (raw.title || 'Bonus Companion Guide').trim(),
            slug: customSlug,
            description: (raw.description || 'Exclusive digital companion guide.').trim(),
            author: (raw.author || author || 'Editorial Staff').trim(),
            category: (raw.category || category || 'General').trim(),
            price: raw.price !== undefined ? Number(raw.price) : 299,
            currency: currency || 'INR',
            publicationType: 'SINGLE',
            coverImageUrl: raw.coverImageUrl || coverImageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 50,
            fileSize: raw.fileSize || '5.0 MB',
            featured: false,
            published: false
          });
          customBonusEbookId = created.id;
        }

        cleanBonusItems.push({
          id: raw.id || `bitem-${Date.now()}-${idx}`,
          sourceType: 'custom',
          ebookId: customBonusEbookId,
          title: (raw.title || 'Untitled Bonus Volume').trim(),
          author: (raw.author || author || 'Author').trim(),
          category: (raw.category || category || 'General').trim(),
          description: (raw.description || '').trim(),
          coverImageUrl: raw.coverImageUrl || coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 50,
          fileSize: raw.fileSize || '5.0 MB',
          price: raw.price !== undefined ? Number(raw.price) : 299
        });
      }
    }

    const newEbook = await db.createEbook({
      title: title.trim(),
      slug,
      description: description.trim(),
      author: (author || 'Editorial Staff').trim(),
      category: (category || 'General').trim(),
      price: numPrice,
      currency: currency || 'INR',
      publicationType: cleanPublicationType,
      totalOriginalValue: totalOriginalValue ? Number(totalOriginalValue) : undefined,
      comboItems: cleanComboItems,
      bonusItems: cleanBonusItems,
      coverImageUrl,
      coverPublicId,
      pdfUrl: pdfUrl || `/api/ebooks/${slug}/pdf-content`,
      pdfPublicId,
      cloudinaryResourceType,
      fileSize: fileSize || '12.5 MB',
      pageCount: Number(pageCount) || 200,
      featured: Boolean(featured),
      published: published !== undefined ? Boolean(published) : true,
      sampleChapter: sampleChapter || 'Chapter 1 Preview available upon purchase...',
      hasBonus: Boolean(req.body.hasBonus || (cleanBonusItems && cleanBonusItems.length > 0)),
      bonusType: req.body.bonusType || 'custom',
      bonusEbookId: req.body.bonusEbookId,
      bonusTitle: req.body.bonusTitle?.trim(),
      bonusDescription: req.body.bonusDescription?.trim(),
      bonusCoverImageUrl: req.body.bonusCoverImageUrl,
      bonusPdfUrl: req.body.bonusPdfUrl,
      bonusPageCount: Number(req.body.bonusPageCount) || 50,
      bonusFileSize: req.body.bonusFileSize || '5.0 MB'
    });

    // Inline coupon creation if enabled in modal
    if (req.body.enableCoupon && req.body.couponCode && req.body.couponDiscountPercentage) {
      try {
        await db.createCoupon({
          code: String(req.body.couponCode).toUpperCase().trim(),
          ebookId: newEbook.id,
          discountPercentage: Number(req.body.couponDiscountPercentage),
          expiresAt: req.body.couponExpiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          unlimitedUsage: Boolean(req.body.couponUnlimited),
          usageLimit: Number(req.body.couponUsageLimit) || 100,
          isActive: true
        });
      } catch (couponErr) {
        console.warn('Inline coupon creation note:', couponErr);
      }
    }

    const reloaded = await db.findEbookById(newEbook.id);
    return res.status(201).json({ ebook: reloaded || newEbook, message: 'Publication created successfully' });
  } catch (err: any) {
    console.error('Create ebook error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to create publication' });
  }
});

router.put('/ebooks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.findEbookById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook not found' });
    }

    const updates = { ...req.body };
    if (updates.price !== undefined) {
      updates.price = Number(updates.price);
    }
    if (updates.totalOriginalValue !== undefined) {
      updates.totalOriginalValue = Number(updates.totalOriginalValue);
    }
    if (updates.pageCount !== undefined) {
      updates.pageCount = Number(updates.pageCount);
    }
    if (updates.title && updates.title !== existing.title) {
      updates.slug = `${slugify(updates.title)}-${id.slice(-4)}`;
    }
    if (updates.hasBonus !== undefined) {
      updates.hasBonus = Boolean(updates.hasBonus);
    }
    if (updates.publicationType) {
      updates.publicationType = updates.publicationType === 'COMBO' ? 'COMBO' : 'SINGLE';
    }
    if (Array.isArray(updates.comboItems)) {
      const cleanComboItems: any[] = [];
      for (let idx = 0; idx < updates.comboItems.length; idx++) {
        const raw = updates.comboItems[idx];
        const isCatalog = raw.sourceType === 'catalog' || (raw.ebookId && !raw.sourceType && raw.ebookId !== id);
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanComboItems.push({
              id: raw.id || `citem-${Date.now()}-${idx}`,
              sourceType: 'catalog',
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
        // Custom volume: update existing or create new real ebook record
        const customSlug = `${slugify(raw.title || 'volume')}-${Date.now().toString().slice(-4)}`;
        let customEbookId = raw.ebookId;
        if (customEbookId) {
          const existingCustom = await db.findEbookById(customEbookId);
          if (existingCustom) {
            await db.updateEbook(customEbookId, {
              title: (raw.title || existingCustom.title).trim(),
              author: (raw.author || existingCustom.author || updates.author || existing.author || 'Author').trim(),
              category: (raw.category || existingCustom.category || updates.category || existing.category || 'General').trim(),
              description: (raw.description || existingCustom.description).trim(),
              price: raw.price !== undefined ? Number(raw.price) : existingCustom.price,
              coverImageUrl: raw.coverImageUrl || existingCustom.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingCustom.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingCustom.pageCount,
              fileSize: raw.fileSize || existingCustom.fileSize
            });
          } else {
            customEbookId = undefined;
          }
        }
        if (!customEbookId) {
          const created = await db.createEbook({
            title: (raw.title || 'Custom Volume').trim(),
            slug: customSlug,
            description: (raw.description || 'Custom volume in combo.').trim(),
            author: (raw.author || updates.author || existing.author || 'Editorial Staff').trim(),
            category: (raw.category || updates.category || existing.category || 'Technology & Engineering').trim(),
            price: raw.price !== undefined ? Number(raw.price) : 399,
            currency: updates.currency || existing.currency || 'INR',
            publicationType: 'SINGLE',
            coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 150,
            fileSize: raw.fileSize || '10 MB',
            featured: false,
            published: false
          });
          customEbookId = created.id;
        }

        cleanComboItems.push({
          id: raw.id || `citem-${Date.now()}-${idx}`,
          sourceType: 'custom',
          ebookId: customEbookId,
          title: (raw.title || 'Untitled Volume').trim(),
          author: (raw.author || updates.author || existing.author || 'Author').trim(),
          category: (raw.category || updates.category || existing.category || 'General').trim(),
          description: (raw.description || '').trim(),
          price: raw.price !== undefined ? Number(raw.price) : 399,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 150,
          fileSize: raw.fileSize || '10 MB',
          coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName
        });
      }
      updates.comboItems = cleanComboItems;
    }
    if (Array.isArray(updates.bonusItems)) {
      const cleanBonusItems: any[] = [];
      for (let idx = 0; idx < updates.bonusItems.length; idx++) {
        const raw = updates.bonusItems[idx];
        const isCatalog = raw.sourceType === 'existing' || raw.sourceType === 'catalog';
        if (isCatalog && raw.ebookId) {
          const catalogBook = await db.findEbookById(raw.ebookId);
          if (catalogBook) {
            cleanBonusItems.push({
              id: raw.id || `bitem-${Date.now()}-${idx}`,
              sourceType: 'existing',
              ebookId: catalogBook.id,
              title: catalogBook.title,
              author: catalogBook.author,
              category: catalogBook.category,
              description: catalogBook.description || 'Included free as a bonus companion edition.',
              coverImageUrl: catalogBook.coverImageUrl,
              pdfUrl: catalogBook.pdfUrl,
              pageCount: catalogBook.pageCount,
              fileSize: catalogBook.fileSize,
              price: catalogBook.price
            });
            continue;
          }
        }
        // Custom bonus: update existing or create real ebook record
        const customSlug = `${slugify(raw.title || 'bonus-guide')}-${Date.now().toString().slice(-4)}`;
        let customBonusEbookId = raw.ebookId;
        if (customBonusEbookId) {
          const existingBonus = await db.findEbookById(customBonusEbookId);
          if (existingBonus) {
            await db.updateEbook(customBonusEbookId, {
              title: (raw.title || existingBonus.title).trim(),
              author: (raw.author || existingBonus.author || updates.author || existing.author || 'Author').trim(),
              category: (raw.category || existingBonus.category || updates.category || existing.category || 'General').trim(),
              description: (raw.description || existingBonus.description).trim(),
              price: raw.price !== undefined ? Number(raw.price) : existingBonus.price,
              coverImageUrl: raw.coverImageUrl || existingBonus.coverImageUrl,
              pdfUrl: raw.pdfUrl || existingBonus.pdfUrl,
              pageCount: raw.pageCount ? Number(raw.pageCount) : existingBonus.pageCount,
              fileSize: raw.fileSize || existingBonus.fileSize
            });
          } else {
            customBonusEbookId = undefined;
          }
        }
        if (!customBonusEbookId) {
          const created = await db.createEbook({
            title: (raw.title || 'Bonus Companion Guide').trim(),
            slug: customSlug,
            description: (raw.description || 'Exclusive digital companion guide.').trim(),
            author: (raw.author || updates.author || existing.author || 'Editorial Staff').trim(),
            category: (raw.category || updates.category || existing.category || 'General').trim(),
            price: raw.price !== undefined ? Number(raw.price) : 299,
            currency: updates.currency || existing.currency || 'INR',
            publicationType: 'SINGLE',
            coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
            pdfUrl: raw.pdfUrl || `/api/ebooks/${customSlug}/pdf-content`,
            pageCount: Number(raw.pageCount) || 50,
            fileSize: raw.fileSize || '5.0 MB',
            featured: false,
            published: false
          });
          customBonusEbookId = created.id;
        }

        cleanBonusItems.push({
          id: raw.id || `bitem-${Date.now()}-${idx}`,
          sourceType: 'custom',
          ebookId: customBonusEbookId,
          title: (raw.title || 'Untitled Bonus Volume').trim(),
          author: (raw.author || updates.author || existing.author || 'Author').trim(),
          category: (raw.category || updates.category || existing.category || 'General').trim(),
          description: (raw.description || '').trim(),
          coverImageUrl: raw.coverImageUrl || updates.coverImageUrl || existing.coverImageUrl,
          pdfUrl: raw.pdfUrl,
          pdfFileName: raw.pdfFileName,
          pageCount: raw.pageCount ? Number(raw.pageCount) : 50,
          fileSize: raw.fileSize || '5.0 MB',
          price: raw.price !== undefined ? Number(raw.price) : 299
        });
      }
      updates.bonusItems = cleanBonusItems;
      if (updates.bonusItems.length > 0) {
        updates.hasBonus = true;
      }
    }

    const updated = await db.updateEbook(id, updates);

    // Inline coupon update or creation if specified
    if (req.body.enableCoupon && req.body.couponCode && req.body.couponDiscountPercentage) {
      const formattedCode = String(req.body.couponCode).toUpperCase().trim();
      const existingCoupons = await db.getCouponsByEbookId(id);
      const existingForEbook = existingCoupons.find(c => c.code.toUpperCase() === formattedCode || c.id === req.body.couponId);

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
            expiresAt: req.body.couponExpiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            unlimitedUsage: Boolean(req.body.couponUnlimited),
            usageLimit: Number(req.body.couponUsageLimit) || 100,
            isActive: true
          });
        } catch (couponErr) {
          console.warn('Inline coupon creation note:', couponErr);
        }
      }
    }

    const reloaded = await db.findEbookById(id);
    return res.json({ ebook: reloaded || updated, message: 'Publication updated successfully' });
  } catch (err: any) {
    console.error('Update ebook error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update publication' });
  }
});

router.delete('/ebooks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteEbook(id);
    if (!deleted) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook not found' });
    }
    return res.json({ success: true, message: 'Ebook deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete ebook' });
  }
});

router.patch('/ebooks/:id/toggle-publish', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.findEbookById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook not found' });
    }

    const updated = await db.updateEbook(id, { published: !existing.published });
    return res.json({ ebook: updated, message: `Ebook ${updated?.published ? 'published' : 'unpublished'}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to toggle publish state' });
  }
});

router.patch('/ebooks/:id/toggle-featured', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.findEbookById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook not found' });
    }

    const updated = await db.updateEbook(id, { featured: !existing.featured });
    return res.json({ ebook: updated, message: `Ebook ${updated?.featured ? 'marked as featured' : 'removed from featured'}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to toggle featured status' });
  }
});

// 3. Admin Purchases
router.get('/purchases', async (req: AuthRequest, res: Response) => {
  try {
    const { status, search } = req.query;
    const purchases = await db.getAllPurchases({
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined
    });
    return res.json({ purchases });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch purchases' });
  }
});

// 4. Admin Coupons Management
router.get('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const { ebookId, activeOnly, search } = req.query;
    const coupons = await db.getAllCoupons({
      ebookId: typeof ebookId === 'string' ? ebookId : undefined,
      activeOnly: activeOnly === 'true',
      search: typeof search === 'string' ? search : undefined
    });
    return res.json({ coupons });
  } catch (err: any) {
    console.error('Fetch coupons error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch coupons' });
  }
});

router.get('/coupons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const coupon = await db.findCouponById(id);
    if (!coupon) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Coupon not found' });
    }
    return res.json({ coupon });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch coupon' });
  }
});

router.post('/coupons', async (req: AuthRequest, res: Response) => {
  try {
    const { code, ebookId, discountPercentage, expiresAt, usageLimit, unlimitedUsage, isActive } = req.body;

    if (!code || !ebookId || discountPercentage === undefined) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Coupon code, applicable ebook, and discount percentage are required'
      });
    }

    const ebook = await db.findEbookById(ebookId);
    if (!ebook) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Selected ebook does not exist' });
    }

    const numDiscount = Number(discountPercentage);
    if (isNaN(numDiscount) || numDiscount <= 0 || numDiscount > 100) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Discount percentage must be a number between 1 and 100'
      });
    }

    const isUnlimited = Boolean(unlimitedUsage);
    const limit = isUnlimited ? 0 : Number(usageLimit) || 100;

    const coupon = await db.createCoupon({
      code: String(code).toUpperCase().trim(),
      ebookId,
      discountPercentage: numDiscount,
      expiresAt: expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: limit,
      unlimitedUsage: isUnlimited,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({ coupon, message: 'Coupon created successfully' });
  } catch (err: any) {
    console.error('Create coupon error:', err);
    return res.status(400).json({ error: 'COUPON_CREATE_FAILED', message: err.message || 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.findCouponById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Coupon not found' });
    }

    const updates = { ...req.body };
    if (updates.code) {
      updates.code = String(updates.code).toUpperCase().trim();
    }
    if (updates.discountPercentage !== undefined) {
      updates.discountPercentage = Math.min(100, Math.max(1, Number(updates.discountPercentage)));
    }
    if (updates.usageLimit !== undefined) {
      updates.usageLimit = Number(updates.usageLimit);
    }
    if (updates.unlimitedUsage !== undefined) {
      updates.unlimitedUsage = Boolean(updates.unlimitedUsage);
      if (updates.unlimitedUsage) {
        updates.usageLimit = 0;
      }
    }

    const updated = await db.updateCoupon(id, updates);
    return res.json({ coupon: updated, message: 'Coupon updated successfully' });
  } catch (err: any) {
    console.error('Update coupon error:', err);
    return res.status(400).json({ error: 'COUPON_UPDATE_FAILED', message: err.message || 'Failed to update coupon' });
  }
});

router.delete('/coupons/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await db.deleteCoupon(id);
    if (!deleted) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Coupon not found' });
    }
    return res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete coupon' });
  }
});

router.patch('/coupons/:id/toggle-active', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.findCouponById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Coupon not found' });
    }

    const updated = await db.updateCoupon(id, { isActive: !existing.isActive });
    return res.json({
      coupon: updated,
      message: `Coupon ${updated?.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to toggle coupon status' });
  }
});

// 5. Admin Users Management
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await db.getAllUsers();
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch users' });
  }
});

router.patch('/users/:id/toggle-active', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentAdminId = req.user!.id;

    if (id === currentAdminId) {
      return res.status(400).json({
        error: 'CANNOT_DEACTIVATE_SELF',
        message: 'Security protection: You cannot deactivate your own administrative account.'
      });
    }

    const user = await db.findUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    const updatedUser = await db.updateUser(id, { isActive: !user.isActive });
    return res.json({
      user: updatedUser,
      message: `User account ${updatedUser?.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update user status' });
  }
});

// 6. Admin Categories Management
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { activeOnly, search } = req.query;
    const categories = await db.getAllCategories({
      activeOnly: activeOnly === 'true',
      search: typeof search === 'string' ? search : undefined
    });
    return res.json({ categories });
  } catch (err: any) {
    console.error('Fetch categories error:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch categories' });
  }
});

router.get('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await db.findCategoryById(id);
    if (!category) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Category not found' });
    }
    return res.json({ category });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch category' });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Category name is required' });
    }

    const category = await db.createCategory({
      name: name.trim(),
      description: description?.trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    return res.status(201).json({ category, message: 'Category created successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: 'CATEGORY_CREATE_FAILED', message: err.message || 'Failed to create category' });
  }
});

router.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const existing = await db.findCategoryById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Category not found' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updated = await db.updateCategory(id, updates);
    return res.json({ category: updated, message: 'Category updated successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: 'CATEGORY_UPDATE_FAILED', message: err.message || 'Failed to update category' });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';
    const result = await db.deleteCategory(id, force);
    if (!result.success) {
      return res.status(404).json({ error: 'NOT_FOUND', message: result.message || 'Category not found' });
    }
    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: 'CATEGORY_DELETE_FAILED', message: err.message || 'Failed to delete category' });
  }
});

router.patch('/categories/:id/toggle-active', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await db.findCategoryById(id);
    if (!existing) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Category not found' });
    }

    const updated = await db.toggleCategoryActive(id);
    return res.json({
      category: updated,
      message: `Category ${updated?.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to toggle category status' });
  }
});

export default router;
