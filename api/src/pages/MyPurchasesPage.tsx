import React, { useState, useEffect } from 'react';
import { Purchase } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiRequest, getStoredToken } from '../lib/api';
import {
  Download,
  BookOpen,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileText,
  Package,
  Gift,
  Ticket,
  Sparkles
} from 'lucide-react';

interface MyPurchasesPageProps {
  onNavigate: (path: string) => void;
  onSelectEbookSlug: (slug: string) => void;
}

export const MyPurchasesPage: React.FC<MyPurchasesPageProps> = ({
  onNavigate,
  onSelectEbookSlug
}) => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchPurchases = async () => {
      try {
        const res = await apiRequest<{ purchases: Purchase[] }>('/api/user/purchases');
        setPurchases(res.purchases || []);
      } catch (err) {
        console.error('Failed to load user purchases:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [isAuthenticated]);

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
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setDownloadingUrl(null), 1000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F0EBE1] text-[#1A1817] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1A1817] mb-2">
          Sign In to View Library
        </h2>
        <p className="text-xs text-[#736B63] mb-6">
          Please sign in to access your purchased publications and download full digital editions.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-[#8B2635] text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-[#731E2A] cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 border-b border-[#E8E2D9] pb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
          Personal Reading Library
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
              My Purchased Publications
            </h1>
            <p className="text-sm text-[#736B63] mt-1">
              You own <strong className="text-[#1A1817]">{purchases.length}</strong> digital order{purchases.length === 1 ? '' : 's'}. All volumes and bonus companions are permanently available for re-download.
            </p>
          </div>

          <button
            onClick={() => onNavigate('/ebooks')}
            className="px-4 py-2 bg-white hover:bg-[#F0EBE1] text-[#1A1817] text-xs font-semibold border border-[#D5CEC5] rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Explore More Books</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-[#E8E2D9] rounded-xl p-5 animate-pulse flex gap-4">
              <div className="w-20 h-28 bg-[#EAE4D9] rounded-md"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-[#EAE4D9] rounded w-1/3"></div>
                <div className="h-3 bg-[#EAE4D9] rounded w-1/4"></div>
                <div className="h-8 bg-[#EAE4D9] rounded w-32"></div>
              </div>
            </div>
          ))}
        </div>
      ) : purchases.length > 0 ? (
        <div className="space-y-6">
          {purchases.map((purchase) => {
            const isCombo = purchase.publicationType === 'COMBO' || (purchase.comboItemsSnapshot && purchase.comboItemsSnapshot.length > 0);
            const entitlements = purchase.entitlements || [];

            return (
              <div
                key={purchase.id}
                id={`purchase-item-${purchase.id}`}
                className={`bg-white border rounded-2xl p-6 shadow-2xs transition-all space-y-5 ${
                  isCombo ? 'border-indigo-200 ring-1 ring-indigo-500/10' : 'border-[#E8E2D9]'
                }`}
              >
                {/* Header Row: Publication Main Info */}
                <div className="flex flex-col sm:flex-row gap-5 items-start justify-between">
                  <div className="flex gap-4">
                    <img
                      src={purchase.ebook?.coverImageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                      alt={purchase.ebook?.title}
                      referrerPolicy="no-referrer"
                      className="w-20 h-28 object-cover rounded-lg shadow-xs shrink-0 border border-[#D5CEC5]"
                    />

                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1B4332]/10 text-[#1B4332] rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED LICENSE
                        </span>
                        {isCombo && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200 flex items-center gap-1">
                            <Package className="w-3 h-3" /> COMBO PACKAGE
                          </span>
                        )}
                        {purchase.couponCodeSnapshot && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1">
                            <Ticket className="w-3 h-3" /> {purchase.couponCodeSnapshot} applied
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => purchase.ebook?.slug && onSelectEbookSlug(purchase.ebook.slug)}
                        className="font-serif text-lg font-bold text-[#1A1817] hover:text-[#8B2635] transition-colors cursor-pointer"
                      >
                        {purchase.ebook?.title || 'Digital Publication'}
                      </h3>

                      <p className="text-xs text-[#736B63]">Curated by {purchase.ebook?.author}</p>

                      <div className="mt-2 text-xs text-[#5A534B] flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8C8276]" />
                          {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-[#1A1817]">
                          <CreditCard className="w-3.5 h-3.5 text-[#8C8276]" />
                          {purchase.currency === 'INR' ? '₹' : '$'}{purchase.amount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Meta Info */}
                  <div className="text-left sm:text-right text-xs text-[#736B63] shrink-0">
                    <span className="font-mono text-[11px] block text-[#9E9589]">
                      Order #{purchase.razorpayOrderId.slice(-8)}
                    </span>
                    <span className="text-[11px] text-[#736B63] block mt-1">
                      {entitlements.length} Digital Asset{entitlements.length === 1 ? '' : 's'} Included
                    </span>
                  </div>
                </div>

                {/* Entitlements & Downloadable Items Grid */}
                <div className="pt-4 border-t border-[#F0EBE1] space-y-3">
                  <h4 className="text-xs font-bold text-[#4A443E] uppercase tracking-wider">
                    Unlocked Digital Downloads ({entitlements.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {entitlements.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
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
                              className="w-9 h-12 object-cover rounded shadow-2xs border border-[#D5CEC5] shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-12 rounded bg-[#EAE4D9] flex items-center justify-center text-[#736B63] shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              {item.type === 'BONUS' ? (
                                <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded uppercase">
                                  Bonus
                                </span>
                              ) : item.type === 'COMBO_ITEM' ? (
                                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded uppercase">
                                  Volume
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-[#736B63] bg-[#EAE4D9] px-1.5 py-0.2 rounded uppercase">
                                  Main PDF
                                </span>
                              )}
                            </div>
                            <h5 className="font-serif font-bold text-xs text-[#1A1817] truncate mt-0.5">
                              {item.title}
                            </h5>
                            <p className="text-[10px] text-[#736B63] truncate">By {item.author}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDownloadEntitlement(item.downloadUrl, item.title)}
                          disabled={downloadingUrl === item.downloadUrl}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs ${
                            item.type === 'BONUS'
                              ? 'bg-purple-700 hover:bg-purple-800 text-white'
                              : item.type === 'COMBO_ITEM'
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-[#8B2635] hover:bg-[#731E2A] text-white'
                          }`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{downloadingUrl === item.downloadUrl ? '...' : 'Download'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Library */
        <div className="text-center py-16 px-4 bg-white border border-[#E8E2D9] rounded-2xl max-w-md mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F0EBE1] text-[#736B63] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1A1817] mb-1">
            Your library is empty
          </h3>
          <p className="text-xs text-[#736B63] mb-6">
            You have not purchased any publications yet. Explore our curated single titles and combo packages to start reading.
          </p>
          <button
            onClick={() => onNavigate('/ebooks')}
            className="px-6 py-2.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Explore Publications
          </button>
        </div>
      )}
    </div>
  );
};
