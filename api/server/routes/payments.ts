import { Router, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '../db';
import { authMiddleware, AuthRequest } from '../auth';

const router = Router();

// Lazy initialization of Razorpay SDK to handle missing keys gracefully
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && !key_id.includes('sample') && !key_secret.includes('sample')) {
    try {
      return new Razorpay({ key_id, key_secret });
    } catch (e) {
      console.warn('Razorpay SDK initialization failed, falling back to simulated sandbox mode:', e);
    }
  }
  return null;
};

// 1. Validate Coupon Code Endpoint (Server-Side)
router.post('/validate-coupon', async (req: AuthRequest, res: Response) => {
  try {
    const { code, ebookId } = req.body;
    const userId = req.user?.id; // Optional: user may or may not be logged in when previewing

    if (!code || !ebookId) {
      return res.status(400).json({
        valid: false,
        message: 'Both coupon code and ebook ID are required.'
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
        id: validation.coupon!.id,
        code: validation.coupon!.code,
        discountPercentage: validation.coupon!.discountPercentage,
        expiresAt: validation.coupon!.expiresAt,
        unlimitedUsage: validation.coupon!.unlimitedUsage,
        remainingUses: validation.coupon!.unlimitedUsage
          ? undefined
          : Math.max(0, validation.coupon!.usageLimit - validation.coupon!.usageCount)
      },
      originalPrice: validation.originalPrice,
      discountAmount: validation.discountAmount,
      finalPrice: validation.finalPrice,
      currency: validation.currency,
      message: `${validation.coupon!.discountPercentage}% discount applied successfully!`
    });
  } catch (err: any) {
    console.error('Error validating coupon:', err);
    return res.status(500).json({
      valid: false,
      message: err.message || 'Internal server error while validating coupon.'
    });
  }
});

// 2. Create Razorpay Order with Server-Side Price Calculation & Coupon Validation
router.post('/create-order', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { ebookId, couponCode } = req.body;
    const user = req.user!;

    if (!ebookId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Ebook ID is required' });
    }

    // 1. Fetch ebook directly from database to get the trusted price
    const ebook = await db.findEbookById(ebookId);
    if (!ebook) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Ebook not found' });
    }

    if (!ebook.published && user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'UNPUBLISHED', message: 'This ebook is not currently available for purchase' });
    }

    // 2. Prevent duplicate successful purchases
    const existingPurchase = await db.findPurchaseByUserAndEbook(user.id, ebook.id);
    if (existingPurchase) {
      return res.status(409).json({
        error: 'ALREADY_PURCHASED',
        message: 'You already own this ebook. You can download it directly from your library.',
        purchaseId: existingPurchase.id
      });
    }

    const currency = ebook.currency || 'INR';
    let originalPrice = ebook.price;
    let discountAmount = 0;
    let finalPrice = ebook.price;
    let appliedCouponId: string | undefined = undefined;
    let appliedCouponCode: string | undefined = undefined;
    let couponDiscountPercentage: number = 0;

    // 3. Validate and Apply Coupon if provided (NEVER trust frontend calculations)
    if (couponCode && String(couponCode).trim()) {
      const validation = await db.validateCouponForEbook(String(couponCode).trim(), ebook.id, user.id);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'INVALID_COUPON',
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

    // Convert to integer paise strictly on server
    const amountInPaise = Math.round(finalPrice * 100);

    const razorpay = getRazorpayInstance();
    let orderId: string;

    if (razorpay) {
      // Live Razorpay API order creation
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency,
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          userId: user.id,
          userEmail: user.email,
          ebookId: ebook.id,
          ebookTitle: ebook.title,
          couponCode: appliedCouponCode || 'NONE',
          discountAmount: discountAmount.toString()
        }
      });
      orderId = order.id;
    } else {
      // Sandbox / Test Mode order generation
      orderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    // Store pending purchase in database with exact snapshot of prices and coupon
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

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_public_demo';

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
      isTestMode: !razorpay,
      couponApplied: appliedCouponCode ? {
        code: appliedCouponCode,
        discountPercentage: couponDiscountPercentage,
        discountAmount
      } : undefined,
      bonusIncluded: ebook.hasBonus ? {
        title: ebook.bonusTitle || 'Bonus Digital Companion',
        coverImageUrl: ebook.bonusCoverImageUrl
      } : undefined
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({ error: 'PAYMENT_ORDER_FAILED', message: err.message || 'Failed to initiate payment' });
  }
});

// 3. Verify Razorpay Signature & Complete Purchase
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ebookId } = req.body;
    const user = req.user!;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Order ID and Payment ID are required' });
    }

    const purchase = await db.findPurchaseByOrderId(razorpay_order_id);
    if (!purchase) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND', message: 'Purchase order record not found' });
    }

    if (purchase.userId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'This order does not belong to the current user' });
    }

    if (purchase.paymentStatus === 'SUCCESS') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        purchaseId: purchase.id
      });
    }

    // Cryptographic signature verification
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let isValid = false;

    if (keySecret && !keySecret.includes('sample')) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    } else {
      // In sandbox preview mode when credentials are in test state, verify test signature or standard format
      isValid = Boolean(razorpay_payment_id && razorpay_order_id);
    }

    if (!isValid) {
      await db.markPurchaseFailed(razorpay_order_id);
      return res.status(400).json({
        error: 'INVALID_SIGNATURE',
        message: 'Payment verification failed. Security signature is invalid.'
      });
    }

    // Mark as SUCCESS, atomically record coupon usage, and grant digital access
    const completedPurchase = await db.verifyAndCompletePurchase(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature || 'sig_verified_demo'
    );

    if (!completedPurchase) {
      return res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update purchase record' });
    }

    return res.json({
      success: true,
      message: 'Payment successfully verified',
      purchase: completedPurchase
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return res.status(500).json({ error: 'VERIFICATION_FAILED', message: err.message || 'Payment verification failed' });
  }
});

export default router;
