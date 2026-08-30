import React from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  sort: string;
  onSortChange: (sort: string) => void;
  totalResults: number;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
  totalResults
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Top Search Input & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C8276] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-catalog-search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, author, or keywords..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#DCD5C9] rounded-xl text-sm text-[#1A1817] placeholder-[#8C8276] focus:outline-none focus:border-[#8B2635] focus:ring-1 focus:ring-[#8B2635] shadow-2xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C8276] hover:text-[#1A1817] p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="select-catalog-sort" className="text-xs font-semibold text-[#736B63] flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </label>
          <select
            id="select-catalog-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-white border border-[#DCD5C9] rounded-xl px-3 py-2 text-xs font-medium text-[#1A1817] focus:outline-none focus:border-[#8B2635] cursor-pointer shadow-2xs"
          >
            <option value="newest">Newest Releases</option>
            <option value="featured">Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          id="btn-category-all"
          type="button"
          onClick={() => onCategoryChange('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
            category === 'all'
              ? 'bg-[#1A1817] text-white shadow-xs'
              : 'bg-[#EAE4D9] text-[#5A534B] hover:bg-[#DCD5C9]'
          }`}
        >
          All Genres
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            id={`btn-category-${cat.toLowerCase().replace(/[\s&]+/g, '-')}`}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              category === cat
                ? 'bg-[#1A1817] text-white shadow-xs'
                : 'bg-[#EAE4D9] text-[#5A534B] hover:bg-[#DCD5C9]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <div className="text-xs text-[#736B63] flex items-center justify-between border-b border-[#E8E2D9] pb-3">
        <span>
          Showing <strong className="text-[#1A1817]">{totalResults}</strong> {totalResults === 1 ? 'publication' : 'publications'}
        </span>
        {(search || category !== 'all') && (
          <button
            onClick={() => {
              onSearchChange('');
              onCategoryChange('all');
            }}
            className="text-xs text-[#8B2635] hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
