import React from 'react';
import { Ebook } from '../types';
import { BookOpen, CheckCircle2, ArrowRight, Package, Gift, Sparkles, Tag } from 'lucide-react';

interface EbookCardProps {
  ebook: Ebook;
  isPurchased?: boolean;
  onSelect: (ebook: Ebook) => void;
}

export const EbookCard: React.FC<EbookCardProps> = ({ ebook, isPurchased = false, onSelect }) => {
  const isCombo = ebook.publicationType === 'COMBO';
  const comboCount = ebook.comboItems?.length || 3;
  
  // Calculate discount based on originalPrice vs price for single ebooks
  // For combo, use totalOriginalValue
  const originalPrice = ebook.originalPrice || ebook.price;
  const sellingPrice = ebook.price;
  const hasDiscount = originalPrice > sellingPrice;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : (isCombo && ebook.totalOriginalValue && ebook.totalOriginalValue > ebook.price
      ? Math.round(((ebook.totalOriginalValue - ebook.price) / ebook.totalOriginalValue) * 100)
      : 0);

  return (
    <article
      id={`ebook-card-${ebook.id}`}
      onClick={() => onSelect(ebook)}
      className={`ebook-card group relative bg-white border rounded-xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer ${
        isCombo ? 'border-indigo-200 hover:border-indigo-400' : 'border-[#E8E2D9] hover:border-[#D5CEC5]'
      }`}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(ebook); } }}
      role="button"
      aria-label={`View ${ebook.title} by ${ebook.author}`}
    >
      {/* Cover Image Container */}
      <div className="relative w-full aspect-[2/3] bg-[#F0EBE1] overflow-hidden">
        <img
          src={ebook.coverImageUrl}
          alt={`${ebook.title} by ${ebook.author}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
          loading="lazy"
          width="280"
          height="420"
        />

        {/* Paper Spine illusion gradient */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
          {isPurchased ? (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#1B4332] text-white rounded-full shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> OWNED
            </span>
          ) : isCombo ? (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full shadow-xs flex items-center gap-1">
              <Package className="w-2.5 h-2.5" /> {comboCount}-IN-1
            </span>
          ) : ebook.featured ? (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#8B2635] text-white rounded-full shadow-xs">
              FEATURED
            </span>
          ) : null}

          {ebook.hasBonus && !isPurchased && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-700 text-white rounded-full shadow-xs flex items-center gap-1">
              <Gift className="w-2 h-2" /> +BONUS
            </span>
          )}

          {hasDiscount && !isPurchased && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full shadow-xs flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" /> -{discountPercent}%
            </span>
          )}
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-white/90 backdrop-blur-xs text-[#1A1817] rounded shadow-xs">
            {ebook.category}
          </span>
        </div>
      </div>

      {/* Book Information */}
      <div className="p-3.5 md:p-4 flex-1 flex flex-col justify-between">
        <div className="min-h-[80px] md:min-h-[90px]">
          <p className="text-[10px] md:text-xs text-[#736B63] font-medium mb-1 truncate">{ebook.author}</p>
          <h3 className="font-serif text-base md:text-lg font-bold text-[#1A1817] group-hover:text-[#8B2635] transition-colors line-clamp-2 leading-snug mb-2">
            {ebook.title}
          </h3>
          <p className="text-[10px] md:text-xs text-[#5A534B] line-clamp-2 leading-relaxed mb-3">
            {ebook.description}
          </p>
        </div>

        {/* Footer Meta & Price */}
        <div className="pt-2.5 border-t border-[#F0EBE1] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] md:text-[10px] font-sans text-[#736B63] uppercase tracking-wider block">
                {isCombo ? `${comboCount} Volumes` : `${ebook.pageCount} Pages • PDF`}
              </span>
              {discountPercent > 0 && (
                <span className="text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded">
                  Save {discountPercent}%
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1 mt-1.5">
              {hasDiscount ? (
                <>
                  <span className="text-xs md:text-sm text-[#9E9589] line-through">
                    {ebook.currency === 'INR' ? '₹' : '$'}{originalPrice}
                  </span>
                  <span className="font-serif text-base md:text-lg font-bold text-[#8B2635]">
                    {ebook.currency === 'INR' ? '₹' : '$'}{sellingPrice}
                  </span>
                </>
              ) : (
                <span className="font-serif text-base md:text-lg font-bold text-[#1A1817]">
                  {ebook.currency === 'INR' ? '₹' : '$'}{sellingPrice}
                </span>
              )}
              {isCombo && ebook.totalOriginalValue && ebook.totalOriginalValue > ebook.price && (
                <span className="text-xs md:text-sm text-[#9E9589] line-through">
                  ₹{ebook.totalOriginalValue}
                </span>
              )}
            </div>
          </div>

          <button
            id={`btn-view-${ebook.id}`}
            type="button"
            className={`px-3 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              isCombo
                ? 'bg-indigo-50 group-hover:bg-indigo-600 text-indigo-900 group-hover:text-white'
                : 'bg-[#F0EBE1] group-hover:bg-[#8B2635] text-[#1A1817] group-hover:text-white'
            }`}
            aria-label={`View ${ebook.title} details`}
          >
            {isPurchased ? 'Read PDF' : isCombo ? 'Explore' : 'Details'}
            <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};