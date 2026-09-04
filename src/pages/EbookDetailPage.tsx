import React, { useState, useEffect } from 'react';
import { Ebook, Purchase } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiRequest, getStoredToken } from '../lib/api';
import {
  BookOpen,
  Download,
  CheckCircle2,
  Lock,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Eye,
  Package,
  Gift,
  Ticket,
  Check,
  Percent,
  Layers
} from 'lucide-react';

interface EbookDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
  onPurchaseSuccess: (purchaseId: string) => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const EbookDetailPage: React.FC<EbookDetailPageProps> = ({
  slug,
  onNavigate,
  onPurchaseSuccess
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingBonus, setDownloadingBonus] = useState(false);
  const [downloadingComboItem, setDownloadingComboItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'volumes' | 'sample'>('overview');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercentage: number;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEbook = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiRequest<{ ebook: Ebook & { isPurchased?: boolean; purchaseId?: string } }>(
          `/api/ebooks/${slug}`
        );
        setEbook(res.ebook);
        setIsPurchased(Boolean(res.ebook.isPurchased));
        if (res.ebook.purchaseId) {
          setPurchaseId(res.ebook.purchaseId);
        }
        if (res.ebook.publicationType === 'COMBO') {
          setActiveTab('volumes');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load ebook details');
      } finally {
        setLoading(false);
      }
    };

    fetchEbook();
  }, [slug, isAuthenticated]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !ebook) return;
    setValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await apiRequest<{
        valid: boolean;
        coupon: { code: string; discountPercentage: number };
        discountAmount: number;
        finalPrice: number;
        message: string;
      }>('/api/payments/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({
          code: couponInput.trim().toUpperCase(),
          ebookId: ebook.id
        })
      });

      if (res.valid) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountPercentage: res.coupon.discountPercentage,
          discountAmount: res.discountAmount,
          finalPrice: res.finalPrice
        });
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid or expired coupon code.');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
  };

  const handleDownload = async () => {
    if (!ebook) return;
    setDownloading(true);
    try {
      const token = getStoredToken();
      const downloadUrl = `/api/ebooks/${ebook.id}/download?token=${encodeURIComponent(token || '')}`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${ebook.slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadBonus = async (bonusItemId?: string, bonusTitleName?: string) => {
    if (!ebook) return;
    setDownloadingBonus(true);
    try {
      const token = getStoredToken();
      let downloadUrl = `/api/ebooks/${ebook.id}/download?type=bonus&token=${encodeURIComponent(token || '')}`;
      if (bonusItemId) {
        downloadUrl += `&bonusItemId=${encodeURIComponent(bonusItemId)}`;
      }
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      const fileSlug = bonusTitleName ? bonusTitleName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `${ebook.slug}-bonus-companion`;
      a.download = `${fileSlug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Bonus download failed. Please try again.');
    } finally {
      setDownloadingBonus(false);
    }
  };

  const handleDownloadComboItem = async (comboItemId: string, itemTitle: string) => {
    if (!ebook) return;
    setDownloadingComboItem(comboItemId);
    try {
      const token = getStoredToken();
      const downloadUrl = `/api/ebooks/${ebook.id}/download?comboItemId=${comboItemId}&token=${encodeURIComponent(token || '')}`;
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${itemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setError('Combo volume download failed. Please try again.');
    } finally {
      setDownloadingComboItem(null);
    }
  };

  const handleBuyNow = async () => {
    if (!ebook) return;
    setError(null);

    // 1. Must be authenticated
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setPurchasing(true);

    try {
      // 2. Server creates order and reads trusted price from database (with coupon if applied)
      const orderData = await apiRequest<{
        orderId: string;
        amount: number;
        originalAmount: number;
        discountAmount: number;
        finalAmount: number;
        currency: string;
        keyId: string;
        ebookTitle: string;
        ebookId: string;
        userEmail: string;
        userName: string;
        isTestMode?: boolean;
      }>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({
          ebookId: ebook.id,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        })
      });

      // 3. Handle Razorpay Checkout
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'FOLIO Bookstore',
          description: `Digital License: ${orderData.ebookTitle}`,
          image: ebook.coverImageUrl,
          order_id: orderData.orderId,
          prefill: {
            name: orderData.userName,
            email: orderData.userEmail
          },
          theme: {
            color: '#8B2635'
          },
          handler: async function (response: any) {
            try {
              // 4. Verify signature on SERVER
              const verifyRes = await apiRequest<{ success: boolean; purchase: Purchase }>(
                '/api/payments/verify',
                {
                  method: 'POST',
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    ebookId: ebook.id
                  })
                }
              );

              setIsPurchased(true);
              setPurchaseId(verifyRes.purchase.id);
              onPurchaseSuccess(verifyRes.purchase.id);
            } catch (vErr: any) {
              setError(vErr.message || 'Payment signature verification failed.');
            } finally {
              setPurchasing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setPurchasing(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setError(response.error?.description || 'Payment was declined or cancelled.');
          setPurchasing(false);
        });
        rzp.open();
      } else {
        setError('Razorpay checkout failed to load. Please refresh the page and try again.');
        setPurchasing(false);
      }
    } catch (err: any) {
      if (err.data?.error === 'ALREADY_PURCHASED') {
        setIsPurchased(true);
        if (err.data.purchaseId) setPurchaseId(err.data.purchaseId);
      }
      setError(err.message || 'Failed to initiate checkout.');
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse space-y-8">
        <div className="h-6 bg-[#EAE4D9] rounded w-24"></div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 aspect-[3/4] bg-[#EAE4D9] rounded-xl"></div>
          <div className="md:col-span-7 space-y-4">
            <div className="h-8 bg-[#EAE4D9] rounded w-3/4"></div>
            <div className="h-4 bg-[#EAE4D9] rounded w-1/3"></div>
            <div className="h-24 bg-[#EAE4D9] rounded w-full"></div>
            <div className="h-12 bg-[#EAE4D9] rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ebook) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1A1817] mb-2">Ebook Not Found</h2>
        <p className="text-xs text-[#736B63] mb-6">{error}</p>
        <button
          onClick={() => onNavigate('/ebooks')}
          className="px-4 py-2 bg-[#1A1817] text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  if (!ebook) return null;

  const isCombo = ebook.publicationType === 'COMBO';
  const comboVolumes = ebook.comboItems || [];
  const savingsPercent = isCombo && ebook.totalOriginalValue && ebook.totalOriginalValue > ebook.price
    ? Math.round(((ebook.totalOriginalValue - ebook.price) / ebook.totalOriginalValue) * 100)
    : 0;
  const currentCheckoutPrice = appliedCoupon ? appliedCoupon.finalPrice : ebook.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <button
        id="btn-back-to-catalog"
        onClick={() => onNavigate('/ebooks')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#736B63] hover:text-[#1A1817] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </button>

      {/* Main Grid: Cover Left, Details Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* LEFT: Ebook Cover Presentation */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className={`relative w-full max-w-sm aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-[#EAE4D9] border ${isCombo ? 'border-indigo-300 ring-2 ring-indigo-500/20' : 'border-[#D5CEC5]'}`}>
            <img
              src={ebook.coverImageUrl}
              alt={ebook.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            {/* Book spine simulation */}
            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/35 via-black/15 to-transparent pointer-events-none" />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none rounded-2xl" />

            {/* Badges */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
              {isPurchased ? (
                <div className="px-3 py-1.5 bg-[#1B4332] text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> OWNED EDITION
                </div>
              ) : isCombo ? (
                <div className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> {comboVolumes.length}-IN-1 COMBO
                </div>
              ) : null}

              {ebook.hasBonus && !isPurchased && (
                <div className="px-2.5 py-1 bg-purple-700 text-white text-[11px] font-bold rounded-full shadow-md flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" /> + BONUS GUIDE
                </div>
              )}
            </div>
          </div>

          {/* Format Spec Below Cover */}
          <div className="mt-6 w-full max-w-sm bg-white border border-[#E8E2D9] rounded-xl p-4 flex items-center justify-around text-center text-xs text-[#736B63]">
            <div>
              <span className="block font-semibold text-[#1A1817]">Edition Type</span>
              <span>{isCombo ? 'Combo Bundle' : 'Single Ebook'}</span>
            </div>
            <div className="h-6 w-px bg-[#E8E2D9]"></div>
            <div>
              <span className="block font-semibold text-[#1A1817]">{isCombo ? 'Volumes' : 'Extent'}</span>
              <span>{isCombo ? `${comboVolumes.length} Books` : `${ebook.pageCount} Pages`}</span>
            </div>
            <div className="h-6 w-px bg-[#E8E2D9]"></div>
            <div>
              <span className="block font-semibold text-[#1A1817]">Delivery</span>
              <span>Instant PDF</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Ebook Details & Purchase Action */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Category & Badges */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#8B2635]/10 text-[#8B2635] rounded-md">
                {ebook.category}
              </span>
              {isCombo && (
                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md flex items-center gap-1">
                  <Package className="w-3 h-3" /> Multi-Volume Master Combo
                </span>
              )}
              {ebook.featured && (
                <span className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-[#1A1817] text-[#E6C994] rounded-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
            </div>

            {/* Title & Author */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1817] leading-tight mb-3">
              {ebook.title}
            </h1>
            <p className="text-sm sm:text-base text-[#736B63] font-medium mb-6">
              Curated by <strong className="text-[#1A1817]">{ebook.author}</strong>
            </p>

            {/* Price & Purchase CTA Block */}
            <div className="p-6 bg-white border border-[#E8E2D9] rounded-2xl shadow-xs mb-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-[#736B63] uppercase tracking-wider block">
                    {isPurchased ? 'License Status' : isCombo ? 'Combo Package License' : 'Single Reader License'}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-3xl font-extrabold text-[#1A1817]">
                      ₹{currentCheckoutPrice}
                    </span>
                    {appliedCoupon ? (
                      <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {appliedCoupon.discountPercentage}% OFF APPLIED (Save ₹{appliedCoupon.discountAmount})
                      </span>
                    ) : isCombo && ebook.totalOriginalValue ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#9E9589] line-through">
                          ₹{ebook.totalOriginalValue}
                        </span>
                        {savingsPercent > 0 && (
                          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Save {savingsPercent}%
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Primary CTA */}
                <div>
                  {isPurchased ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {!isCombo ? (
                        <button
                          id="btn-download-purchased-ebook"
                          type="button"
                          onClick={handleDownload}
                          disabled={downloading}
                          className="px-6 py-3 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Download className="w-4 h-4" />
                          {downloading ? 'Preparing PDF...' : 'Download Main PDF'}
                        </button>
                      ) : null}

                      <button
                        onClick={() => onNavigate('/account/purchases')}
                        className="px-5 py-3 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" /> Go To My Library
                      </button>
                    </div>
                  ) : (
                    <button
                      id="btn-buy-now-detail"
                      type="button"
                      onClick={handleBuyNow}
                      disabled={purchasing}
                      className="w-full sm:w-auto px-8 py-3.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {purchasing ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          <span>Opening Secure Checkout...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>{isCombo ? 'Get Combo Package' : 'Buy Now'} • ₹{currentCheckoutPrice}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Coupon Redemption Input (When not already purchased) */}
              {!isPurchased && (
                <div className="pt-4 border-t border-[#F0EBE1]">
                  {appliedCoupon ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-mono font-bold text-emerald-950 uppercase">{appliedCoupon.code}</span>
                        <span className="text-xs text-emerald-800">
                          — {appliedCoupon.discountPercentage}% discount applied!
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-600 hover:text-red-800 font-semibold cursor-pointer underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Ticket className="w-4 h-4 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            id="input-detail-coupon"
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Enter promotional coupon code..."
                            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817] uppercase font-mono font-semibold"
                          />
                        </div>
                        <button
                          id="btn-apply-coupon"
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim() || validatingCoupon}
                          className="px-4 py-2 bg-[#F0EBE1] hover:bg-[#E3DBCF] text-[#1A1817] text-xs font-semibold rounded-lg border border-[#D5CEC5] transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {validatingCoupon ? 'Checking...' : 'Apply Coupon'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {couponError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Security indicators */}
              <div className="pt-3 border-t border-[#F0EBE1] grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#736B63]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#8B2635]" /> Razorpay Secured
                </span>
                <span className="flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#8B2635]" /> Instant Library Download
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#8B2635]" /> Lifetime Re-downloads
                </span>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Bonus Companion Section Callout */}
            {ebook.hasBonus && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl mb-8 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                      <Gift className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                      Included Free Digital Companion{ebook.bonusItems && ebook.bonusItems.length > 1 ? `s (${ebook.bonusItems.length})` : ''}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                    ₹0 Additional Cost
                  </span>
                </div>

                {ebook.bonusItems && ebook.bonusItems.length > 0 ? (
                  <div className="space-y-2">
                    {ebook.bonusItems.map((bItem, bIdx) => (
                      <div key={bItem.id || bIdx} className="flex items-center gap-4 bg-white/80 p-3 rounded-xl border border-purple-100">
                        {bItem.coverImageUrl ? (
                          <img
                            src={bItem.coverImageUrl}
                            alt={bItem.title}
                            className="w-12 h-16 object-cover rounded shadow-2xs border border-purple-200 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-16 rounded bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                            #{bIdx + 1}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-sm text-purple-950 truncate">
                            {bItem.title}
                          </h4>
                          <p className="text-xs text-purple-900/80 line-clamp-2 mt-0.5">
                            {bItem.description || 'Included free of charge alongside your digital edition.'}
                          </p>
                          <span className="text-[10px] text-purple-700 font-semibold block mt-1">
                            {bItem.pageCount || 50} Pages • Instant Unlock
                          </span>
                        </div>

                        {isPurchased && (
                          <button
                            type="button"
                            onClick={() => handleDownloadBonus(bItem.id, bItem.title)}
                            disabled={downloadingBonus}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingBonus ? 'Preparing...' : 'Download'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 bg-white/80 p-3 rounded-xl border border-purple-100">
                    {ebook.bonusCoverImageUrl && (
                      <img
                        src={ebook.bonusCoverImageUrl}
                        alt={ebook.bonusTitle || 'Bonus'}
                        className="w-12 h-16 object-cover rounded shadow-2xs border border-purple-200 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif font-bold text-sm text-purple-950 truncate">
                        {ebook.bonusTitle || 'Bonus Reference Guide'}
                      </h4>
                      <p className="text-xs text-purple-900/80 line-clamp-2 mt-0.5">
                        {ebook.bonusDescription || 'Included free of charge alongside your digital edition.'}
                      </p>
                      <span className="text-[10px] text-purple-700 font-semibold block mt-1">
                        {ebook.bonusPageCount || 50} Pages • Instant Unlock
                      </span>
                    </div>

                    {isPurchased && (
                      <button
                        type="button"
                        onClick={() => handleDownloadBonus(undefined, ebook.bonusTitle)}
                        disabled={downloadingBonus}
                        className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingBonus ? 'Preparing...' : 'Download Bonus'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-[#E8E2D9] mb-4 flex gap-6">
              {isCombo && (
                <button
                  onClick={() => setActiveTab('volumes')}
                  className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                    activeTab === 'volumes'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-[#736B63] hover:text-[#1A1817]'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> Included Volumes ({comboVolumes.length})
                </button>
              )}

              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-[#8B2635] text-[#8B2635]'
                    : 'border-transparent text-[#736B63] hover:text-[#1A1817]'
                }`}
              >
                Synopsis & Description
              </button>

              <button
                onClick={() => setActiveTab('sample')}
                className={`pb-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'sample'
                    ? 'border-[#8B2635] text-[#8B2635]'
                    : 'border-transparent text-[#736B63] hover:text-[#1A1817]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Sample Excerpt
              </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'volumes' && isCombo ? (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                  Purchasing this combo grants full individual ownership to all <strong>{comboVolumes.length} volumes</strong> below. Each volume will be unlocked in your personal library with individual PDF downloads.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {comboVolumes.map((volume, idx) => (
                    <div
                      key={volume.id || idx}
                      className="p-4 bg-white border border-[#E8E2D9] rounded-xl shadow-2xs flex items-start gap-3"
                    >
                      {volume.coverImageUrl ? (
                        <img
                          src={volume.coverImageUrl}
                          alt={volume.title}
                          className="w-12 h-16 object-cover rounded shadow-2xs border border-[#D5CEC5] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-[#F0EBE1] rounded flex items-center justify-center text-xs font-bold text-[#736B63] shrink-0">
                          Vol {idx + 1}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-indigo-700 uppercase">Volume {idx + 1}</span>
                          <span className="text-[11px] font-bold text-[#1A1817]">₹{volume.price}</span>
                        </div>
                        <h4 className="font-serif font-bold text-xs text-[#1A1817] truncate mt-0.5">
                          {volume.title}
                        </h4>
                        <p className="text-[11px] text-[#736B63] truncate">By {volume.author}</p>
                        <span className="text-[10px] text-[#8C8276] block mt-1">
                          {volume.pageCount || 200} Pages • High-Res PDF
                        </span>

                        {isPurchased && (
                          <button
                            type="button"
                            onClick={() => handleDownloadComboItem(volume.id, volume.title)}
                            disabled={downloadingComboItem === volume.id}
                            className="mt-2 px-2.5 py-1 bg-[#1B4332] hover:bg-[#143326] text-white text-[10px] font-semibold rounded flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            {downloadingComboItem === volume.id ? 'Downloading...' : 'Download Volume'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'overview' ? (
              <div className="space-y-4 text-sm text-[#4A443E] leading-relaxed">
                <p>{ebook.description}</p>
                <div className="mt-4 p-4 bg-[#F0EBE1]/70 border border-[#E3DBCF] rounded-xl">
                  <h4 className="font-serif font-bold text-xs text-[#1A1817] uppercase tracking-wider mb-2">
                    Included with this digital license:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#5A534B]">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B2635]"></span>
                      {isCombo
                        ? `Complete access to all ${comboVolumes.length} digital volumes with high-resolution PDFs`
                        : `Full high-resolution PDF document (${ebook.pageCount} pages)`}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B2635]"></span>
                      Permanent digital ownership linked securely to your account
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B2635]"></span>
                      DRM-free formatted for iPad, Kindle, Mac, PC, and mobile reading
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-white border border-[#E8E2D9] rounded-xl space-y-3 font-serif text-sm leading-relaxed text-[#2D2A28]">
                <h3 className="font-bold text-base text-[#1A1817] border-b border-[#E8E2D9] pb-2">
                  Sample Excerpt Preview
                </h3>
                <p className="italic text-xs text-[#736B63]">
                  Excerpt from {ebook.title} by {ebook.author}:
                </p>
                <p>{ebook.sampleChapter || 'Sample preview excerpt is being curated for this title.'}</p>
                <p className="text-xs text-[#736B63] pt-4 border-t border-[#F0EBE1]">
                  Purchase this publication to unlock full chapters, appendices, and downloadable assets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
