import React, { useState, useEffect, useCallback } from 'react';
import { Ebook } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface AdminEbooksPageProps {
  onOpenNewEbook: () => void;
  onEditEbook: (ebook: Ebook) => void;
}

export const AdminEbooksPage: React.FC<AdminEbooksPageProps> = ({
  onOpenNewEbook,
  onEditEbook
}) => {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEbooks = useCallback(async () => {
    if (authLoading || !isAuthenticated || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ ebooks: Ebook[] }>('/api/admin/ebooks');
      setEbooks(res.ebooks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load publications catalog');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchEbooks();
    }
  }, [authLoading, isAuthenticated, isAdmin, fetchEbooks]);

  const handleTogglePublish = async (id: string) => {
    try {
      await apiRequest(`/api/admin/ebooks/${id}/toggle-publish`, { method: 'PATCH' });
      await fetchEbooks();
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await apiRequest(`/api/admin/ebooks/${id}/toggle-featured`, { method: 'PATCH' });
      await fetchEbooks();
    } catch (err) {
      console.error('Toggle featured error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      await apiRequest(`/api/admin/ebooks/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      await fetchEbooks();
    } catch (err) {
      console.error('Delete ebook error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEbooks = ebooks.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.author.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
            Ebook Publications Catalog
          </h1>
          <p className="text-xs text-[#736B63] mt-1">
            Manage titles, digital asset delivery files, pricing, and live storefront visibility.
          </p>
        </div>

        <button
          id="btn-admin-add-ebook-page"
          onClick={onOpenNewEbook}
          className="px-4 py-2.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New Title
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog titles..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg text-xs text-[#1A1817] focus:outline-none focus:border-[#8B2635]"
          />
        </div>

        <div className="text-xs text-[#736B63]">
          Total: <strong className="text-[#1A1817]">{filteredEbooks.length}</strong> publications
        </div>
      </div>

      {/* Ebooks Table */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#736B63]">
            Loading publications catalog...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchEbooks}
              className="px-3 py-1.5 bg-[#8B2635] text-white text-xs font-semibold rounded-lg hover:bg-[#731E2A] inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
            </button>
          </div>
        ) : filteredEbooks.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF9F5] text-[#736B63] border-b border-[#E8E2D9]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Publication</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Price</th>
                  <th className="py-3 px-4 font-semibold">Sales / Downloads</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filteredEbooks.map((ebook) => (
                  <tr key={ebook.id} className="hover:bg-[#FBF9F5]/70 transition-colors">
                    {/* Publication */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={ebook.coverImageUrl}
                          alt={ebook.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-14 object-cover rounded shadow-2xs shrink-0 border border-[#D5CEC5]"
                        />
                        <div className="min-w-0 max-w-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {ebook.publicationType === 'COMBO' ? (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-200 flex items-center gap-1">
                                📦 {ebook.comboItems?.length || 3}-in-1 Combo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-[#F0EBE1] text-[#736B63] text-[10px] font-semibold rounded">
                                Single Book
                              </span>
                            )}
                            {ebook.hasBonus && (
                              <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded border border-purple-200">
                                🎁 Bonus
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-sm text-[#1A1817] truncate mt-0.5">{ebook.title}</h4>
                          <p className="text-[11px] text-[#736B63] truncate">By {ebook.author}</p>
                          <span className="text-[10px] text-[#8C8276]">
                            {ebook.publicationType === 'COMBO'
                              ? `${ebook.comboItems?.length || 'Multi'} Volumes Included`
                              : `${ebook.fileSize} • ${ebook.pageCount} Pages`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-[#5A534B]">
                      {ebook.category}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 font-bold text-[#1A1817]">
                      <div>
                        <span>{ebook.currency === 'INR' ? '₹' : '$'}{ebook.price}</span>
                        {ebook.publicationType === 'COMBO' && ebook.totalOriginalValue && (
                          <span className="block text-[10px] text-[#9E9589] line-through font-normal">
                            Val: ₹{ebook.totalOriginalValue}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Downloads */}
                    <td className="py-3 px-4 text-[#1A1817] font-medium">
                      {ebook.downloadCount || 0} purchases
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            ebook.published
                              ? 'bg-green-50 text-green-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ebook.published ? 'PUBLISHED' : 'DRAFT'}
                        </span>

                        {ebook.featured && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#8B2635]/10 text-[#8B2635] rounded">
                            FEATURED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Toggle Featured */}
                        <button
                          title={ebook.featured ? 'Unmark featured' : 'Mark as featured'}
                          onClick={() => handleToggleFeatured(ebook.id)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            ebook.featured ? 'text-[#8B2635] bg-[#8B2635]/10' : 'text-[#8C8276] hover:bg-[#F0EBE1]'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Toggle Publish */}
                        <button
                          title={ebook.published ? 'Unpublish' : 'Publish'}
                          onClick={() => handleTogglePublish(ebook.id)}
                          className="p-1.5 text-[#8C8276] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded transition-colors cursor-pointer"
                        >
                          {ebook.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-700" />}
                        </button>

                        {/* Edit */}
                        <button
                          title="Edit publication"
                          onClick={() => onEditEbook(ebook)}
                          className="p-1.5 text-[#8C8276] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          title="Delete publication"
                          onClick={() => setDeleteConfirmId(ebook.id)}
                          className="p-1.5 text-[#8C8276] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#736B63]">
            No ebooks match your query.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1817]/60 backdrop-blur-xs">
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#1A1817] mb-2">Delete Publication?</h3>
            <p className="text-xs text-[#736B63] mb-6">
              Are you sure you want to permanently delete this ebook? Readers who previously bought it may lose access to new downloads.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-[#5A534B] hover:bg-[#F0EBE1] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
