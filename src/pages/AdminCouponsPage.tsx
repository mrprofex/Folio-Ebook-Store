import React, { useState, useEffect } from 'react';
import { Coupon, Ebook } from '../types';
import {
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit2,
  Copy,
  Check,
  AlertCircle,
  BookOpen,
  Percent,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface AdminCouponsPageProps {
  onNavigateToEbooks?: () => void;
}

export const AdminCouponsPage: React.FC<AdminCouponsPageProps> = ({ onNavigateToEbooks }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEbookId, setFilterEbookId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    ebookId: '',
    discountPercentage: 20,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    unlimitedUsage: true,
    usageLimit: 100,
    isActive: true
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('folio_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const [couponsRes, ebooksRes] = await Promise.all([
        fetch('/api/admin/coupons', { headers }),
        fetch('/api/ebooks', { headers })
      ]);

      if (!couponsRes.ok) throw new Error('Failed to load coupons');
      if (!ebooksRes.ok) throw new Error('Failed to load ebooks');

      const couponsData = await couponsRes.json();
      const ebooksData = await ebooksRes.json();

      setCoupons(couponsData.coupons || []);
      setEbooks(ebooksData.ebooks || []);
      if (ebooksData.ebooks && ebooksData.ebooks.length > 0 && !formData.ebookId) {
        setFormData(prev => ({ ...prev, ebookId: ebooksData.ebooks[0].id }));
      }
    } catch (err: any) {
      console.error('Error fetching admin coupon data:', err);
      setError(err.message || 'Unable to retrieve coupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      ebookId: ebooks[0]?.id || '',
      discountPercentage: 20,
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      unlimitedUsage: true,
      usageLimit: 100,
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      ebookId: coupon.ebookId,
      discountPercentage: coupon.discountPercentage,
      expiresAt: new Date(coupon.expiresAt).toISOString().split('T')[0],
      unlimitedUsage: coupon.unlimitedUsage,
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      alert('Please enter a coupon code.');
      return;
    }
    if (!formData.ebookId) {
      alert('Please select an applicable ebook.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('folio_auth_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountPercentage: Number(formData.discountPercentage),
        usageLimit: Number(formData.usageLimit),
        expiresAt: new Date(formData.expiresAt).toISOString()
      };

      let res;
      if (editingCoupon) {
        res = await fetch(`/api/admin/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/coupons', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'Operation failed');
      }

      showToast(editingCoupon ? `Coupon ${payload.code} updated!` : `Coupon ${payload.code} created!`);
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const token = localStorage.getItem('folio_auth_token');
      const res = await fetch(`/api/admin/coupons/${id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setCoupons(prev => prev.map(c => (c.id === id ? { ...c, isActive: !currentActive } : c)));
        showToast(`Coupon status ${!currentActive ? 'activated' : 'deactivated'}.`);
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon code "${coupon.code}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('folio_auth_token');
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        setCoupons(prev => prev.filter(c => c.id !== coupon.id));
        showToast(`Coupon ${coupon.code} deleted.`);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter(c => {
    const isExpired = new Date(c.expiresAt) < new Date();
    const isLimitReached = !c.unlimitedUsage && c.usageCount >= c.usageLimit;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCode = c.code.toLowerCase().includes(q);
      const matchEbook = c.ebookTitle?.toLowerCase().includes(q);
      if (!matchCode && !matchEbook) return false;
    }

    if (filterEbookId !== 'all' && c.ebookId !== filterEbookId) {
      return false;
    }

    if (filterStatus === 'active') {
      return c.isActive && !isExpired && !isLimitReached;
    }
    if (filterStatus === 'inactive') {
      return !c.isActive;
    }
    if (filterStatus === 'expired') {
      return isExpired || isLimitReached;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1817] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-[#E6C994]/30 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-medium">{successMessage}</span>
        </div>
      )}

      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DEC8] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded bg-[#8B2635]/10 text-[#8B2635]">
              <Ticket className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1A1817]">
              Coupon Codes & Discounts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#736B63] mt-1">
            Create single-book promotional codes with custom percentage discounts, usage limits, and expiration windows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-coupons"
            onClick={fetchData}
            className="p-2.5 rounded-lg border border-[#D5CEC5] bg-[#FAF8F5] text-[#736B63] hover:text-[#1A1817] hover:border-[#1A1817] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-add-coupon"
            onClick={handleOpenCreateModal}
            className="py-2.5 px-4 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6DEC8] shadow-2xs">
          <p className="text-[11px] font-medium text-[#736B63] uppercase tracking-wider">Total Coupons</p>
          <p className="text-2xl font-serif font-bold text-[#1A1817] mt-1">{coupons.length}</p>
        </div>
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6DEC8] shadow-2xs">
          <p className="text-[11px] font-medium text-[#736B63] uppercase tracking-wider">Active Live</p>
          <p className="text-2xl font-serif font-bold text-emerald-700 mt-1">
            {coupons.filter(c => c.isActive && new Date(c.expiresAt) >= new Date()).length}
          </p>
        </div>
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6DEC8] shadow-2xs">
          <p className="text-[11px] font-medium text-[#736B63] uppercase tracking-wider">Total Redemptions</p>
          <p className="text-2xl font-serif font-bold text-[#8B2635] mt-1">
            {coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
          </p>
        </div>
        <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6DEC8] shadow-2xs">
          <p className="text-[11px] font-medium text-[#736B63] uppercase tracking-wider">Avg Discount</p>
          <p className="text-2xl font-serif font-bold text-[#1A1817] mt-1">
            {coupons.length > 0
              ? `${Math.round(coupons.reduce((sum, c) => sum + c.discountPercentage, 0) / coupons.length)}%`
              : '0%'}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6DEC8] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9589]" />
          <input
            id="input-search-coupons"
            type="text"
            placeholder="Search by code or ebook title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D5CEC5] rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-1 focus:ring-[#8B2635]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Ebook Filter */}
          <select
            id="select-filter-ebook"
            value={filterEbookId}
            onChange={(e) => setFilterEbookId(e.target.value)}
            className="py-2 px-3 text-xs bg-white border border-[#D5CEC5] rounded-lg text-[#1A1817] focus:outline-none focus:border-[#8B2635]"
          >
            <option value="all">All Ebooks ({ebooks.length})</option>
            {ebooks.map(eb => (
              <option key={eb.id} value={eb.id}>{eb.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex rounded-lg border border-[#D5CEC5] bg-white p-0.5">
            {(['all', 'active', 'inactive', 'expired'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded capitalize transition-colors cursor-pointer ${
                  filterStatus === st
                    ? 'bg-[#1A1817] text-white font-semibold'
                    : 'text-[#736B63] hover:text-[#1A1817]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coupons Table / Grid */}
      {loading ? (
        <div className="bg-[#FAF8F5] p-12 text-center rounded-xl border border-[#E6DEC8]">
          <RefreshCw className="w-8 h-8 text-[#8B2635] animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#736B63]">Loading coupon records...</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-[#FAF8F5] p-12 text-center rounded-xl border border-[#E6DEC8]">
          <Ticket className="w-10 h-10 text-[#D5CEC5] mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-[#1A1817]">No coupons found</h3>
          <p className="text-xs text-[#736B63] max-w-md mx-auto mt-1 mb-4">
            {searchQuery || filterStatus !== 'all' || filterEbookId !== 'all'
              ? 'Try resetting your filters or search term.'
              : 'Create your first promotional discount code to incentivize readers.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="py-2 px-4 bg-[#8B2635] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Coupon
          </button>
        </div>
      ) : (
        <div className="bg-[#FAF8F5] rounded-xl border border-[#E6DEC8] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6DEC8] bg-[#F4EFE6]/60 text-[11px] font-semibold text-[#736B63] uppercase tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Target Ebook</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DEC8] text-xs text-[#1A1817]">
                {filteredCoupons.map((coupon) => {
                  const isExpired = new Date(coupon.expiresAt) < new Date();
                  const isLimitReached = !coupon.unlimitedUsage && coupon.usageCount >= coupon.usageLimit;
                  const isLive = coupon.isActive && !isExpired && !isLimitReached;

                  return (
                    <tr key={coupon.id} className="hover:bg-white/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-[#1A1817] text-[#E6C994] px-2.5 py-1 rounded tracking-widest uppercase border border-[#E6C994]/20 shadow-2xs">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 text-[#9E9589] hover:text-[#1A1817] rounded transition-colors cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2 truncate">
                          <BookOpen className="w-3.5 h-3.5 text-[#8B2635] shrink-0" />
                          <span className="font-medium truncate" title={coupon.ebookTitle || 'Ebook'}>
                            {coupon.ebookTitle || 'Target Ebook'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Percent className="w-3 h-3" />
                          {coupon.discountPercentage}% OFF
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium">
                            {coupon.usageCount} {coupon.unlimitedUsage ? 'used' : `/ ${coupon.usageLimit}`}
                          </span>
                          {coupon.unlimitedUsage ? (
                            <span className="text-[10px] text-[#736B63] block">Unlimited uses</span>
                          ) : (
                            <div className="w-20 bg-[#E6DEC8] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#8B2635] h-full"
                                style={{
                                  width: `${Math.min(100, (coupon.usageCount / Math.max(1, coupon.usageLimit)) * 100)}%`
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-[#736B63]">
                          <Clock className="w-3.5 h-3.5 text-[#9E9589]" />
                          <span>{new Date(coupon.expiresAt).toLocaleDateString()}</span>
                        </div>
                        {isExpired && (
                          <span className="text-[10px] text-red-600 font-medium block">Expired</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Expired
                          </span>
                        ) : isLimitReached ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                            Limit Reached
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-toggle-coupon-${coupon.id}`}
                            onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              coupon.isActive
                                ? 'text-emerald-700 hover:bg-emerald-100/60'
                                : 'text-[#9E9589] hover:bg-[#E6DEC8]'
                            }`}
                            title={coupon.isActive ? 'Deactivate Coupon' : 'Activate Coupon'}
                          >
                            {coupon.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </button>

                          <button
                            id={`btn-edit-coupon-${coupon.id}`}
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-[#736B63] hover:text-[#1A1817] hover:bg-[#E6DEC8] rounded transition-colors cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            id={`btn-delete-coupon-${coupon.id}`}
                            onClick={() => handleDelete(coupon)}
                            className="p-1.5 text-[#9E9589] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border border-[#E6DEC8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#E6DEC8] pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#8B2635]/10 text-[#8B2635]">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#1A1817]">
                    {editingCoupon ? 'Edit Coupon Code' : 'Create New Coupon'}
                  </h2>
                  <p className="text-xs text-[#736B63]">
                    Scoped to a single book with strict server-side validation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#9E9589] hover:text-[#1A1817] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                  Coupon Code *
                </label>
                <div className="relative">
                  <input
                    id="modal-coupon-code"
                    type="text"
                    required
                    placeholder="e.g. LAUNCH50, DESIGN25"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs uppercase font-mono font-bold tracking-wider bg-white border border-[#D5CEC5] rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-1 focus:ring-[#8B2635]"
                  />
                </div>
                <p className="text-[10px] text-[#736B63] mt-1">Automatically converted to uppercase.</p>
              </div>

              {/* Target Ebook */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                  Applicable Ebook *
                </label>
                <select
                  id="modal-coupon-ebook"
                  required
                  value={formData.ebookId}
                  onChange={(e) => setFormData({ ...formData, ebookId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D5CEC5] rounded-lg text-[#1A1817] focus:outline-none focus:border-[#8B2635]"
                >
                  {ebooks.map(eb => (
                    <option key={eb.id} value={eb.id}>
                      {eb.title} — ₹{eb.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                    Discount Percentage (1–100%) *
                  </label>
                  <div className="relative">
                    <input
                      id="modal-coupon-discount"
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#D5CEC5] rounded-lg focus:outline-none focus:border-[#8B2635]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#736B63] font-semibold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1817] mb-1">
                    Expiration Date *
                  </label>
                  <input
                    id="modal-coupon-expiry"
                    type="date"
                    required
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D5CEC5] rounded-lg focus:outline-none focus:border-[#8B2635]"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="p-3 bg-white rounded-lg border border-[#E6DEC8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1A1817]">Unlimited Redemptions</span>
                  <input
                    id="modal-coupon-unlimited"
                    type="checkbox"
                    checked={formData.unlimitedUsage}
                    onChange={(e) => setFormData({ ...formData, unlimitedUsage: e.target.checked })}
                    className="w-4 h-4 accent-[#8B2635] rounded cursor-pointer"
                  />
                </div>

                {!formData.unlimitedUsage && (
                  <div>
                    <label className="block text-xs text-[#736B63] mb-1">
                      Maximum Total Uses
                    </label>
                    <input
                      id="modal-coupon-limit"
                      type="number"
                      min={1}
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#D5CEC5] rounded-lg focus:outline-none focus:border-[#8B2635]"
                    />
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#E6DEC8]">
                <div>
                  <span className="text-xs font-semibold text-[#1A1817] block">Active Status</span>
                  <span className="text-[10px] text-[#736B63]">Allow readers to apply this code immediately</span>
                </div>
                <input
                  id="modal-coupon-active"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-[#8B2635] rounded cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DEC8]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#736B63] hover:text-[#1A1817] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-coupon-modal"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : editingCoupon ? (
                    'Save Changes'
                  ) : (
                    'Create Coupon'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
