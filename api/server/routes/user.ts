import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

// Get authenticated user's purchases
router.get('/purchases', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const purchases = await db.getUserPurchases(userId);
    return res.json({ purchases });
  } catch (err: any) {
    console.error('Error fetching user purchases:', err);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch your purchases' });
  }
});

// Get single purchase detail
router.get('/purchases/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const purchase = await db.findPurchaseById(id);

    if (!purchase) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Purchase record not found' });
    }

    if (purchase.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Unauthorized to view this purchase' });
    }

    return res.json({ purchase });
  } catch (err: any) {
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch purchase details' });
  }
});

export default router;
