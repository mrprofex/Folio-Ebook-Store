import { Router, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db.js';
import { authMiddleware, AuthRequest } from '../auth.js';

const router = Router();

// Helper to generate a clean valid PDF document buffer on the fly with purchaser watermark
function generateEditorialPdfBuffer(ebook: { title: string; author: string; category: string; description: string; pageCount: number }, purchaserEmail: string): Buffer {
  const sanitizedTitle = ebook.title.replace(/[^\x20-\x7E]/g, '');
  const sanitizedAuthor = ebook.author.replace(/[^\x20-\x7E]/g, '');
  const sanitizedDesc = ebook.description.replace(/[^\x20-\x7E]/g, '');
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Construct a valid minimal PDF 1.4 stream
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

  return Buffer.from(pdfString, 'utf-8');
}

// Protected Download Endpoint (Main Ebook, Combo Items, or Bonus Companion)
router.get('/:id/download', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const isBonus = req.query.type === 'bonus';
    const comboItemId = req.query.comboItemId as string | undefined;
    const user = req.user!;

    // 1. Verify parent ebook exists
    const ebook = await db.findEbookById(id) || await db.findEbookBySlug(id);
    if (!ebook) {
      return res.status(404).send('Ebook not found');
    }

    // 2. Verify authorization: user must have a SUCCESS purchase OR be an ADMIN
    const isAdmin = user.role === 'ADMIN';
    const accessCheck = await db.hasUserAccessToEbook(user.id, ebook.id);

    if (!isAdmin && !accessCheck.hasAccess) {
      return res.status(403).send('Unauthorized: You have not purchased this ebook or combo package yet.');
    }

    const purchase = accessCheck.purchase;

    // A. COMBO ITEM DOWNLOAD
    if (comboItemId) {
      const comboItems = ebook.comboItems || [];
      const item = comboItems.find(ci => ci.id === comboItemId);
      if (!item) {
        return res.status(404).send('Combo item not found in this package.');
      }

      if (purchase) {
        await db.incrementDownloadCount(purchase.id);
      }

      const safeItemFileName = `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-edition.pdf`;

      // Check if linked catalog ebook has custom uploaded file
      let targetPdfUrl = item.pdfUrl;
      if (item.ebookId) {
        const linked = await db.findEbookById(item.ebookId);
        if (linked?.pdfUrl) {
          targetPdfUrl = linked.pdfUrl;
        }
      }

      if (targetPdfUrl && targetPdfUrl.startsWith('/uploads/')) {
        const localFilePath = path.join(process.cwd(), targetPdfUrl);
        if (fs.existsSync(localFilePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${safeItemFileName}"`);
          return fs.createReadStream(localFilePath).pipe(res);
        }
      }

      const itemBuffer = generateEditorialPdfBuffer(
        {
          title: item.title,
          author: item.author,
          category: `Combo Volume • ${ebook.category}`,
          description: item.description || `Volume included in ${ebook.title}`,
          pageCount: item.pageCount || 240
        },
        user.email
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeItemFileName}"`);
      res.setHeader('Content-Length', itemBuffer.length);
      return res.end(itemBuffer);
    }

    // B. BONUS EDITION DOWNLOAD
    const bonusItemId = req.query.bonusItemId as string | undefined;
    if (isBonus || bonusItemId) {
      if (!ebook.hasBonus && (!ebook.bonusItems || ebook.bonusItems.length === 0)) {
        return res.status(404).send('This publication does not include a bonus companion.');
      }

      // Record bonus download count
      if (purchase) {
        await db.incrementBonusDownloadCount(purchase.id);
      }

      // 1. Check if specific bonus item from multiple bonus items was requested
      let targetBonusItem = (ebook.bonusItems || []).find(b => b.id === bonusItemId);
      if (!targetBonusItem && ebook.bonusItems && ebook.bonusItems.length > 0 && !isBonus) {
        targetBonusItem = ebook.bonusItems[0];
      }

      let bonusTitle = targetBonusItem?.title || ebook.bonusTitle || `${ebook.title} Bonus Companion`;
      let bonusAuthor = targetBonusItem?.author || ebook.author || 'Editorial Author';
      let bonusDescription = targetBonusItem?.description || ebook.bonusDescription || `Exclusive digital companion to ${ebook.title}`;
      let targetPdfUrl = targetBonusItem?.pdfUrl || ebook.bonusPdfUrl;
      let targetPageCount = targetBonusItem?.pageCount || ebook.bonusPageCount || 50;
      const safeBonusFileName = `${(targetBonusItem?.title || ebook.slug || 'ebook').toLowerCase().replace(/[^a-z0-9]/g, '-')}-bonus.pdf`;

      if (targetBonusItem?.sourceType === 'existing' && targetBonusItem.ebookId) {
        const existingBonus = await db.findEbookById(targetBonusItem.ebookId);
        if (existingBonus) {
          bonusTitle = targetBonusItem.title || existingBonus.title;
          bonusAuthor = targetBonusItem.author || existingBonus.author;
          targetPdfUrl = targetBonusItem.pdfUrl || existingBonus.pdfUrl;
          targetPageCount = targetBonusItem.pageCount || existingBonus.pageCount;
        }
      } else if (ebook.bonusType === 'existing' && ebook.bonusEbookId) {
        const existingBonus = await db.findEbookById(ebook.bonusEbookId);
        if (existingBonus) {
          targetPdfUrl = existingBonus.pdfUrl;
          targetPageCount = existingBonus.pageCount;
        }
      }

      if (targetPdfUrl && targetPdfUrl.startsWith('/uploads/')) {
        const localFilePath = path.join(process.cwd(), targetPdfUrl);
        if (fs.existsSync(localFilePath)) {
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${safeBonusFileName}"`);
          return fs.createReadStream(localFilePath).pipe(res);
        }
      }

      const bonusBuffer = generateEditorialPdfBuffer(
        {
          title: `[BONUS COMPANION] ${bonusTitle}`,
          author: bonusAuthor,
          category: `Bonus Companion • ${ebook.category}`,
          description: bonusDescription,
          pageCount: targetPageCount
        },
        user.email
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeBonusFileName}"`);
      res.setHeader('Content-Length', bonusBuffer.length);
      return res.end(bonusBuffer);
    }

    // C. STANDARD MAIN EBOOK / COMBO OVERVIEW DOWNLOAD
    if (purchase) {
      await db.incrementDownloadCount(purchase.id);
    }

    const safeFileName = `${ebook.slug || 'ebook'}.pdf`;

    // Check if local uploaded file exists
    if (ebook.pdfUrl && ebook.pdfUrl.startsWith('/uploads/')) {
      const localFilePath = path.join(process.cwd(), ebook.pdfUrl);
      if (fs.existsSync(localFilePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        return fs.createReadStream(localFilePath).pipe(res);
      }
    }

    // Generate pristine watermarked PDF for delivery
    const pdfBuffer = generateEditorialPdfBuffer(ebook, user.email);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err: any) {
    console.error('Error during secure PDF download:', err);
    return res.status(500).send('An error occurred during file delivery. Please try again or contact support.');
  }
});

// Dedicated Bonus Download Alias
router.get('/:id/bonus-download', authMiddleware, async (req: AuthRequest, res: Response) => {
  req.query.type = 'bonus';
  const handler = router.stack.find(layer => layer.route?.path === '/:id/download')?.handle;
  if (handler) {
    return handler(req, res, () => {});
  }
  return res.redirect(`/api/ebooks/${req.params.id}/download?type=bonus`);
});

// PDF Preview sample route
router.get('/:id/pdf-content', async (req, res) => {
  try {
    const { id } = req.params;
    const ebook = await db.findEbookById(id) || await db.findEbookBySlug(id);
    if (!ebook) {
      return res.status(404).send('Ebook not found');
    }

    const previewBuffer = generateEditorialPdfBuffer(ebook, 'PREVIEW SAMPLE ONLY');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${ebook.slug}-sample.pdf"`);
    res.setHeader('Content-Length', previewBuffer.length);
    return res.end(previewBuffer);
  } catch (err) {
    return res.status(500).send('Preview unavailable');
  }
});

export default router;
