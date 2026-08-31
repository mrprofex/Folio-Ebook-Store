import React, { useState, useEffect, useCallback } from 'react';
import { DashboardStats } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  DollarSign,
  ShoppingBag,
  Users,
  BookOpen,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Plus,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AdminDashboardPageProps {
  onNavigateSection: (section: 'dashboard' | 'ebooks' | 'categories' | 'coupons' | 'purchases' | 'users') => void;
  onOpenNewEbook: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateSection,
  onOpenNewEbook
}) => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (authLoading || !isAuthenticated || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ stats: DashboardStats }>('/api/admin/dashboard');
      setStats(res.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchStats();
    }
  }, [authLoading, isAuthenticated, isAdmin, fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#EAE4D9] rounded w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 bg-[#EAE4D9] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#E8E2D9] rounded-xl p-8 text-center max-w-md mx-auto shadow-sm">
        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="font-serif font-bold text-base text-[#1A1817] mb-1">Failed to Load Dashboard</h3>
        <p className="text-xs text-[#736B63] mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-[#8B2635] text-white text-xs font-semibold rounded-lg hover:bg-[#731E2A] flex items-center gap-1.5 mx-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
            Storefront Analytics & Overview
          </h1>
          <p className="text-xs text-[#736B63] mt-1">
            Real-time business performance derived exclusively from verified Razorpay transactions.
          </p>
        </div>

        <button
          id="btn-admin-dash-new-ebook"
          onClick={onOpenNewEbook}
          className="px-4 py-2.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Ebook
        </button>
      </div>

      {/* KPI 5-Card Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total Earnings */}
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#736B63] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Earnings</span>
            <div className="w-8 h-8 rounded-lg bg-[#8B2635]/10 text-[#8B2635] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1817]">
            ₹{stats.totalEarnings.toLocaleString()}
          </p>
          <span className="text-[10px] text-green-700 font-medium mt-1 block">
            Verified Net Sales
          </span>
        </div>

        {/* 2. Today's Earnings */}
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-[#736B63] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1817]">
            ₹{stats.todayEarnings.toLocaleString()}
          </p>
          <span className="text-[10px] text-[#736B63] mt-1 block">
            Current Day Period
          </span>
        </div>

        {/* 3. Total Purchases */}
        <div 
          onClick={() => onNavigateSection('purchases')}
          className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs hover:border-[#8B2635]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#736B63] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Purchases</span>
            <div className="w-8 h-8 rounded-lg bg-[#1A1817]/5 text-[#1A1817] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1817]">
            {stats.totalPurchases}
          </p>
          <span className="text-[10px] text-[#8B2635] font-medium mt-1 flex items-center gap-0.5">
            View Transactions <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* 4. Total Users */}
        <div 
          onClick={() => onNavigateSection('users')}
          className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs hover:border-[#8B2635]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#736B63] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-[#1A1817]/5 text-[#1A1817] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1817]">
            {stats.totalUsers}
          </p>
          <span className="text-[10px] text-[#8B2635] font-medium mt-1 flex items-center gap-0.5">
            Manage Users <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* 5. Total Ebooks */}
        <div 
          onClick={() => onNavigateSection('ebooks')}
          className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs hover:border-[#8B2635]/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#736B63] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Titles</span>
            <div className="w-8 h-8 rounded-lg bg-[#1A1817]/5 text-[#1A1817] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1817]">
            {stats.totalEbooks}
          </p>
          <span className="text-[10px] text-[#8B2635] font-medium mt-1 flex items-center gap-0.5">
            Catalog Manager <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A1817]">Revenue Performance</h3>
            <p className="text-xs text-[#736B63]">Monthly verified sales trajectory</p>
          </div>
          <span className="text-xs font-semibold text-[#8B2635] px-2.5 py-1 bg-[#8B2635]/10 rounded-md">
            All Time Growth
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B2635" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8B2635" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EBE1" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#736B63', fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#736B63', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1817',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FBF9F5',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Verified Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#8B2635" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Top Selling Books & Recent Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top-Selling Ebooks */}
        <div className="lg:col-span-5 bg-white border border-[#E8E2D9] rounded-xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8E2D9]">
            <h3 className="font-serif text-base font-bold text-[#1A1817]">Top Selling Titles</h3>
            <button
              onClick={() => onNavigateSection('ebooks')}
              className="text-xs text-[#8B2635] hover:underline"
            >
              All Books
            </button>
          </div>

          <div className="space-y-3">
            {stats.topSellingEbooks.length > 0 ? (
              stats.topSellingEbooks.map((item, idx) => (
                <div key={item.ebook.id} className="flex items-center justify-between py-2 border-b border-[#F0EBE1] last:border-0">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-xs font-bold text-[#736B63] w-4">{idx + 1}.</span>
                    <img
                      src={item.ebook.coverImageUrl}
                      alt={item.ebook.title}
                      referrerPolicy="no-referrer"
                      className="w-9 h-12 object-cover rounded shadow-2xs shrink-0"
                    />
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-[#1A1817] truncate">{item.ebook.title}</h4>
                      <p className="text-[11px] text-[#736B63] truncate">{item.ebook.author}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-[#1A1817] block">₹{item.revenue.toLocaleString()}</span>
                    <span className="text-[10px] text-[#736B63]">{item.salesCount} sold</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#736B63] py-4 text-center">No sales recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-7 bg-white border border-[#E8E2D9] rounded-xl p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8E2D9]">
            <h3 className="font-serif text-base font-bold text-[#1A1817]">Recent Verified Orders</h3>
            <button
              onClick={() => onNavigateSection('purchases')}
              className="text-xs text-[#8B2635] hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#736B63] border-b border-[#E8E2D9]">
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 font-semibold">Publication</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {stats.recentPurchases.slice(0, 5).map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="py-2.5 pr-2">
                      <p className="font-medium text-[#1A1817] truncate">{purchase.user?.name || 'Customer'}</p>
                      <p className="text-[10px] text-[#736B63] truncate">{purchase.user?.email}</p>
                    </td>
                    <td className="py-2.5 pr-2 truncate max-w-[140px]">
                      {purchase.ebook?.title || 'Ebook'}
                    </td>
                    <td className="py-2.5 pr-2 font-semibold text-[#1A1817]">
                      {purchase.currency === 'INR' ? '₹' : '$'}{purchase.amount}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 rounded inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {purchase.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
