import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Purchase } from '../types';
import { apiRequest, getStoredToken } from '../lib/api';
import { CheckCircle2, Download, ShoppingBag, ArrowRight, ShieldCheck, FileText, Package, Gift, Ticket } from 'lucide-react';

interface PurchaseSuccessPageProps {
  purchaseId: string;
  onNavigate: (path: string) => void;
}

export const PurchaseSuccessPage: React.FC<PurchaseSuccessPageProps> = ({
  purchaseId,
  onNavigate
}) => {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8B2635', '#E6C994', '#1A1817', '#2D6A4F', '#4F46E5']
      });
    } catch (e) {
      // Ignore if confetti blocked
    }

    const fetchPurchase = async () => {
      try {
        const res = await apiRequest<{ purchase: Purchase }>(`/api/user/purchases/${purchaseId}`);
        setPurchase(res.purchase);
      } catch (err) {
        console.error('Failed to load purchase details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (purchaseId) {
      fetchPurchase();
    }
  }, [purchaseId]);

  const handleDownloadEntitlement = (url: string, filename: string) => {
    setDownloadingUrl(url);
    try {
      const token = getStoredToken();
      const finalUrl = `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`;

      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = `${filename || 'ebook'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download trigger error:', err);
    } finally {
      setTimeout(() => setDownloadingUrl(null), 1000);
    }
  };

  const isCombo = purchase?.publicationType === 'COMBO' || (purchase?.comboItemsSnapshot && purchase.comboItemsSnapshot.length > 0);
  const entitlements = purchase?.entitlements || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div 
        id="purchase-success-card"
        className="bg-white border border-[#E8E2D9] rounded-2xl shadow-xl overflow-hidden p-6 sm:p-10 text-center space-y-6"
      >
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#1B4332] block mb-1">
            Payment Verified & Confirmed
          </span>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817] mb-2">
            Thank You for Your Order!
          </h1>

          <p className="text-sm text-[#736B63] max-w-md mx-auto">
            Your payment was successfully verified. Your digital license is activated, and all digital volumes are unlocked below.
          </p>
        </div>

        {/* Ebook / Combo Summary Card */}
        {purchase && purchase.ebook && (
          <div className="max-w-lg mx-auto bg-[#FBF9F5] border border-[#E8E2D9] rounded-2xl p-5 text-left flex gap-4 items-center">
            <img
              src={purchase.ebook.coverImageUrl}
              alt={purchase.ebook.title}
              referrerPolicy="no-referrer"
              className="w-18 h-24 object-cover rounded-lg shadow-xs shrink-0 border border-[#D5CEC5]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="text-[10px] uppercase font-bold text-[#8B2635] bg-[#8B2635]/10 px-2 py-0.5 rounded">
                  {isCombo ? 'Combo Package' : 'Digital Edition'}
                </span>
                {purchase.couponCodeSnapshot && (
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    🎟️ {purchase.couponCodeSnapshot} applied
                  </span>
                )}
              </div>

              <h3 className="font-serif text-base font-bold text-[#1A1817] truncate">
                {purchase.ebook.title}
              </h3>
              <p className="text-xs text-[#736B63] truncate">By {purchase.ebook.author}</p>
              
              <div className="mt-1 flex items-center gap-3 text-xs font-semibold text-[#1A1817]">
                <span>Total Paid: ₹{purchase.amount}</span>
                <span className="text-[#9E9589] font-normal">• Order #{purchase.razorpayOrderId.slice(-8)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Downloadable Assets Section */}
        {entitlements.length > 0 && (
          <div className="max-w-lg mx-auto text-left space-y-2 pt-2">
            <h4 className="text-xs font-bold text-[#4A443E] uppercase tracking-wider">
              Download Your Purchased Files ({entitlements.length}):
            </h4>
            <div className="space-y-2">
              {entitlements.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    item.type === 'BONUS'
                      ? 'bg-purple-50/60 border-purple-200'
                      : item.type === 'COMBO_ITEM'
                      ? 'bg-indigo-50/50 border-indigo-200'
                      : 'bg-[#FBF9F5] border-[#E8E2D9]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.coverImageUrl ? (
                      <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-8 h-10 object-cover rounded shadow-2xs border border-[#D5CEC5] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-10 rounded bg-[#EAE4D9] flex items-center justify-center text-[#736B63] shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#736B63]">
                        {item.type === 'BONUS' ? '🎁 Bonus Guide' : item.type === 'COMBO_ITEM' ? '📦 Volume' : '📄 Main Ebook'}
                      </span>
                      <h5 className="font-serif font-bold text-xs text-[#1A1817] truncate">{item.title}</h5>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownloadEntitlement(item.downloadUrl, item.title)}
                    disabled={downloadingUrl === item.downloadUrl}
                    className="px-3 py-1.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingUrl === item.downloadUrl ? '...' : 'Download'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            id="btn-success-goto-purchases"
            type="button"
            onClick={() => onNavigate('/account/purchases')}
            className="w-full sm:w-auto px-6 py-3 bg-[#F0EBE1] hover:bg-[#EAE4D9] text-[#1A1817] text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Go to My Library</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/ebooks')}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-[#F0EBE1] text-[#1A1817] text-xs font-semibold border border-[#D5CEC5] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Continue Browsing Catalog</span>
          </button>
        </div>

        {/* Transaction Metadata Info */}
        {purchase && (
          <div className="pt-6 border-t border-[#E8E2D9] text-xs text-[#736B63] grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <span className="block text-[#9E9589]">Payment Status</span>
              <strong className="text-[#1B4332] font-semibold">{purchase.paymentStatus}</strong>
            </div>
            <div>
              <span className="block text-[#9E9589]">Date Issued</span>
              <strong className="text-[#1A1817] font-medium">
                {new Date(purchase.purchasedAt).toLocaleDateString()}
              </strong>
            </div>
            <div>
              <span className="block text-[#9E9589]">License Type</span>
              <strong className="text-[#1A1817] font-medium">Personal Multi-Asset License</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
