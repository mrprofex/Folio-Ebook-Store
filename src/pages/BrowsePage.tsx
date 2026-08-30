import React, { useState, useEffect } from 'react';
import { Ebook } from '../types';
import { apiRequest } from '../lib/api';
import { EbookCard } from '../components/EbookCard';
import { SearchFilterBar } from '../components/SearchFilterBar';
import { BookOpen, Sparkles } from 'lucide-react';

interface BrowsePageProps {
  initialCategory?: string;
  initialSort?: string;
  onSelectEbook: (ebook: Ebook) => void;
  ownedEbookIds: Set<string>;
}

export const BrowsePage: React.FC<BrowsePageProps> = ({
  initialCategory = 'all',
  initialSort = 'newest',
  onSelectEbook,
  ownedEbookIds
}) => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiRequest<{ categories: string[] }>('/api/ebooks/categories');
        setCategories(res.categories || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchEbooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (category && category !== 'all') params.append('category', category);
        if (sort) params.append('sort', sort);

        const res = await apiRequest<{ ebooks: Ebook[] }>(`/api/ebooks?${params.toString()}`);
        setEbooks(res.ebooks || []);
      } catch (err) {
        console.error('Failed to fetch ebooks:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchEbooks();
    }, 150);

    return () => clearTimeout(timer);
  }, [search, category, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
          Catalog & Publications
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1817]">
          Explore Ebooks
        </h1>
        <p className="text-sm text-[#736B63] mt-2 max-w-xl">
          Discover comprehensive digital guides across software engineering, typography, business architecture, and timeless philosophy.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        sort={sort}
        onSortChange={setSort}
        totalResults={ebooks.length}
      />

      {/* Catalog Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E8E2D9] rounded-xl overflow-hidden animate-pulse">
              <div className="w-full aspect-[3/4] bg-[#EAE4D9]"></div>
              <div className="p-5 space-y-3">
                <div className="h-3 bg-[#EAE4D9] rounded w-1/3"></div>
                <div className="h-4 bg-[#EAE4D9] rounded w-3/4"></div>
                <div className="h-3 bg-[#EAE4D9] rounded w-full"></div>
                <div className="h-4 bg-[#EAE4D9] rounded w-1/4 pt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : ebooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ebooks.map((ebook) => (
            <EbookCard
              key={ebook.id}
              ebook={ebook}
              isPurchased={ownedEbookIds.has(ebook.id)}
              onSelect={onSelectEbook}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white border border-[#E8E2D9] rounded-2xl max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#F0EBE1] text-[#736B63] flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#1A1817] mb-1">
            No publications found
          </h3>
          <p className="text-xs text-[#736B63] mb-6">
            We couldn't find any ebooks matching your query. Try broadening your keywords or resetting category filters.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('all');
            }}
            className="px-4 py-2 bg-[#1A1817] text-white text-xs font-semibold rounded-lg hover:bg-[#332F2C] transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
