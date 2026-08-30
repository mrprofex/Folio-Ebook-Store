import React, { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';
import { apiRequest } from '../lib/api';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Check,
  X,
  Layers,
  FileText
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [modalName, setModalName] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalIsActive, setModalIsActive] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) {
        queryParams.set('search', searchQuery.trim());
      }
      if (statusFilter === 'active') {
        queryParams.set('activeOnly', 'true');
      }

      const res = await apiRequest<{ categories: Category[] }>(
        `/api/admin/categories${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      );

      let data = res.categories || [];
      if (statusFilter === 'inactive') {
        data = data.filter(c => !c.isActive);
      }
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setModalName('');
    setModalDescription('');
    setModalIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setModalName(cat.name);
    setModalDescription(cat.description || '');
    setModalIsActive(cat.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) {
      setModalError('Category name is required');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      if (editingCategory) {
        // Edit existing category
        await apiRequest(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: modalName.trim(),
            description: modalDescription.trim(),
            isActive: modalIsActive
          })
        });
        setActionSuccess(`Category "${modalName}" updated successfully.`);
      } else {
        // Create new category
        await apiRequest('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: modalName.trim(),
            description: modalDescription.trim(),
            isActive: modalIsActive
          })
        });
        setActionSuccess(`Category "${modalName}" created successfully.`);
      }

      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setModalError(err.message || 'Failed to save category');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await apiRequest(`/api/admin/categories/${cat.id}/toggle-active`, {
        method: 'PATCH'
      });
      setCategories(prev =>
        prev.map(c => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
      );
      setActionSuccess(`Category "${cat.name}" is now ${!cat.isActive ? 'Active' : 'Inactive'}.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to toggle category status');
    }
  };

  const handleConfirmDelete = async (force: boolean = false) => {
    if (!deletingCategory) return;
    setDeleteLoading(true);
    setDeleteError(null);

    try {
      await apiRequest(`/api/admin/categories/${deletingCategory.id}${force ? '?force=true' : ''}`, {
        method: 'DELETE'
      });
      setActionSuccess(`Category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
      fetchCategories();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete category');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D9] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-[#8B2635]/10 text-[#8B2635] rounded-lg">
              <FolderTree className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
              Category Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#736B63]">
            Organize catalog publications into structured editorial categories. Updates cascade automatically to associated books.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-refresh-categories"
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            className="p-2.5 text-[#736B63] hover:text-[#1A1817] bg-white border border-[#DCD5C9] rounded-lg hover:bg-[#FBF9F5] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-add-category"
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#9E9589] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-categories"
            type="text"
            placeholder="Search category name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#736B63] whitespace-nowrap">Filter Status:</span>
          <div className="inline-flex p-1 bg-[#F4EFE6] rounded-lg border border-[#E8E2D9] text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                  : 'text-[#736B63] hover:text-[#1A1817]'
              }`}
            >
              All ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                  : 'text-[#736B63] hover:text-[#1A1817]'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-white text-[#1A1817] shadow-2xs font-semibold'
                  : 'text-[#736B63] hover:text-[#1A1817]'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Categories Table Card */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#8B2635] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-serif text-sm font-semibold text-[#1A1817]">Loading Categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F4EFE6] text-[#9E9589] flex items-center justify-center mx-auto">
              <FolderTree className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1817]">No Categories Found</h3>
            <p className="text-xs text-[#736B63]">
              {searchQuery ? `No categories match "${searchQuery}".` : 'Get started by creating your first editorial category.'}
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-[#FBF9F5] border-b border-[#E8E2D9] text-[#736B63] uppercase tracking-wider text-[11px] font-semibold">
                  <th className="py-3.5 px-4 sm:px-6">Category Name</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-center">Publications</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-[#FAF8F5] transition-colors"
                  >
                    {/* Name & Slug */}
                    <td className="py-4 px-4 sm:px-6">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F4EFE6] text-[#8B2635] flex items-center justify-center shrink-0 mt-0.5">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-serif font-bold text-[#1A1817] text-sm block">
                            {cat.name}
                          </span>
                          <span className="text-[11px] font-mono text-[#9E9589] block">
                            /{cat.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4 max-w-xs text-xs text-[#5A534B]">
                      {cat.description || (
                        <span className="text-[#9E9589] italic">No description provided</span>
                      )}
                    </td>

                    {/* Ebook Count */}
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F4EFE6] text-[#1A1817] rounded-full text-xs font-semibold border border-[#E8E2D9]">
                        <BookOpen className="w-3.5 h-3.5 text-[#8B2635]" />
                        {cat.ebookCount !== undefined ? cat.ebookCount : 0} books
                      </span>
                    </td>

                    {/* Status Badge & Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          cat.isActive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {cat.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-stone-500" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1.5 text-[#5A534B] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingCategory(cat);
                            setDeleteError(null);
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Category"
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
        )}
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1817]/70 backdrop-blur-xs">
          <div
            id="category-modal-card"
            className="relative w-full max-w-md bg-[#FBF9F5] border border-[#E8E2D9] shadow-2xl rounded-2xl overflow-hidden p-6 space-y-5 animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#8B2635]/10 text-[#8B2635] rounded-xl">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1A1817]">
                    {editingCategory ? 'Edit Category' : 'Create New Category'}
                  </h3>
                  <p className="text-xs text-[#736B63]">
                    {editingCategory ? 'Modify category name or visibility' : 'Add a new subject category to the catalog'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#9E9589] hover:text-[#1A1817] p-1 rounded-lg hover:bg-[#F0EBE1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  id="input-modal-category-name"
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence & ML"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="textarea-modal-category-desc"
                  rows={3}
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  placeholder="Short editorial summary of what books in this category cover..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                />
              </div>

              <div className="p-3.5 bg-white border border-[#E8E2D9] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#1A1817] block">Active Status</span>
                  <span className="text-[11px] text-[#736B63]">
                    Active categories appear in store filters and publication editors
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalIsActive}
                    onChange={(e) => setModalIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5A534B] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-modal-category"
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 text-xs font-semibold bg-[#8B2635] hover:bg-[#731E2A] text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {modalLoading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1817]/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-[#E8E2D9] shadow-2xl rounded-2xl overflow-hidden p-6 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#1A1817]">
                Delete Category "{deletingCategory.name}"?
              </h3>
              <p className="text-xs text-[#736B63] leading-relaxed">
                {(deletingCategory.ebookCount || 0) > 0
                  ? `There are ${deletingCategory.ebookCount} publication(s) currently tagged under this category.`
                  : 'This category has no attached publications and can be safely deleted.'}
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {(deletingCategory.ebookCount || 0) > 0 ? (
                <>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => handleConfirmDelete(true)}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? 'Reassigning & Deleting...' : 'Reassign Books to "General" & Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(null)}
                    className="w-full py-2 px-4 bg-[#FBF9F5] hover:bg-[#F0EBE1] text-[#1A1817] border border-[#D5CEC5] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E8E2D9]">
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#5A534B] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => handleConfirmDelete(false)}
                    className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
