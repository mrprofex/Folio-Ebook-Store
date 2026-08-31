import React, { useState, useEffect, useCallback } from 'react';
import { Purchase } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  Search,
  ShoppingBag,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Calendar,
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const AdminPurchasesPage: React.FC = () => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPurchases = useCallback(async () => {
    if (authLoading || !isAuthenticated || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const res = await apiRequest<{ purchases: Purchase[] }>(`/api/admin/purchases?${params.toString()}`);
      setPurchases(res.purchases || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction ledger');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isAdmin, search, statusFilter]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      const timer = setTimeout(() => {
        fetchPurchases();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [search, statusFilter, authLoading, isAuthenticated, isAdmin, fetchPurchases]);

  const totalSuccessfulRevenue = purchases
    .filter(p => p.paymentStatus === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
            Purchases & Financial Ledger
          </h1>
          <p className="text-xs text-[#736B63] mt-1">
            Complete audit trail of Razorpay digital sales, customer ownership, and download counts.
          </p>
        </div>

        <div className="px-3.5 py-2 bg-white border border-[#E8E2D9] rounded-lg shadow-2xs text-xs self-start sm:self-auto">
          <span className="text-[#736B63]">Filtered Total: </span>
          <strong className="text-[#1A1817] font-serif text-sm">₹{totalSuccessfulRevenue.toLocaleString()}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, book, or Order ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg text-xs text-[#1A1817] focus:outline-none focus:border-[#8B2635]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs text-[#736B63] font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg px-2.5 py-1.5 text-xs text-[#1A1817] focus:outline-none focus:border-[#8B2635]"
          >
            <option value="all">All Transactions</option>
            <option value="SUCCESS">Verified (SUCCESS)</option>
            <option value="PENDING">Pending (PENDING)</option>
            <option value="FAILED">Failed (FAILED)</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#736B63]">
            Loading transaction logs...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchPurchases}
              className="px-3 py-1.5 bg-[#8B2635] text-white text-xs font-semibold rounded-lg hover:bg-[#731E2A] inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
            </button>
          </div>
        ) : purchases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF9F5] text-[#736B63] border-b border-[#E8E2D9]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Ebook Title</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Razorpay Identifiers</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-[#FBF9F5]/70 transition-colors">
                    {/* Customer */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1A1817]">{purchase.user?.name || 'Customer'}</p>
                      <p className="text-[11px] text-[#736B63]">{purchase.user?.email || purchase.userId}</p>
                    </td>

                    {/* Ebook Title */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 max-w-xs truncate">
                        {purchase.ebook?.coverImageUrl && (
                          <img
                            src={purchase.ebook.coverImageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-7 h-10 object-cover rounded shadow-2xs shrink-0"
                          />
                        )}
                        <span className="font-medium text-[#1A1817] truncate">
                          {purchase.ebook?.title || purchase.ebookId}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 font-bold text-[#1A1817]">
                      {purchase.currency === 'INR' ? '₹' : '$'}{purchase.amount}
                    </td>

                    {/* Razorpay IDs */}
                    <td className="py-3 px-4 font-mono text-[10px] text-[#5A534B]">
                      <div>Order: {purchase.razorpayOrderId}</div>
                      {purchase.razorpayPaymentId && (
                        <div className="text-[#8C8276]">Pay: {purchase.razorpayPaymentId}</div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded inline-flex items-center gap-1 ${
                          purchase.paymentStatus === 'SUCCESS'
                            ? 'bg-green-50 text-green-700'
                            : purchase.paymentStatus === 'PENDING'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {purchase.paymentStatus === 'SUCCESS' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : purchase.paymentStatus === 'PENDING' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {purchase.paymentStatus}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-3 px-4 text-[#736B63] text-[11px] whitespace-nowrap">
                      {new Date(purchase.purchasedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#736B63]">
            No purchases found matching current criteria.
          </div>
        )}
      </div>
    </div>
  );
};
