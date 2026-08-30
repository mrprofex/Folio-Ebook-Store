import React, { useState, useEffect } from 'react';
import { Ebook } from '../types';
import { apiRequest } from '../lib/api';
import { EbookCard } from '../components/EbookCard';
import { BookCardSkeletonGrid } from '../components/LoadingSpinner';
import {
  ArrowRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Zap,
  Download,
  CreditCard,
  Library,
  Feather
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectEbook: (ebook: Ebook) => void;
  ownedEbookIds: Set<string>;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectEbook,
  ownedEbookIds
}) => {
  const [featuredEbooks, setFeaturedEbooks] = useState<Ebook[]>([]);
  const [latestEbooks, setLatestEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const [featuredRes, allRes] = await Promise.all([
          apiRequest<{ ebooks: Ebook[] }>('/api/ebooks/featured'),
          apiRequest<{ ebooks: Ebook[] }>('/api/ebooks?sort=newest')
        ]);
        setFeaturedEbooks(featuredRes.ebooks || []);
        setLatestEbooks((allRes.ebooks || []).slice(0, 4));
      } catch (err) {
        console.error('Error fetching homepage ebooks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  return (
    <div className="space-y-24">
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[#E8E2D9]">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B2635]/10 text-[#8B2635] text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Curated Digital Editions
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#1A1817] tracking-tight leading-[1.15] mb-6">
            Stories, Ideas & Knowledge — Delivered Digitally.
          </h1>

          <p className="text-base sm:text-lg text-[#5A534B] leading-relaxed max-w-2xl mx-auto mb-10 font-sans">
            A premium independent imprint for engineers, designers, thinkers, and builders. Instant digital ownership, lifetime PDF downloads, and zero clutter.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="btn-hero-explore"
              onClick={() => onNavigate('/ebooks')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-lg"
            >
              <span>Explore Ebooks</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="btn-hero-browse-featured"
              onClick={() => onNavigate('/ebooks?sort=featured')}
              className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-[#F0EBE1] text-[#1A1817] text-sm font-semibold border border-[#D5CEC5] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Browse Collection</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. FEATURED EBOOKS */}
      {(loading || featuredEbooks.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E8E2D9]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
                Handpicked Works
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                Featured Publications
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/ebooks?sort=featured')}
              className="mt-3 sm:mt-0 text-xs font-semibold text-[#8B2635] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View all featured <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <BookCardSkeletonGrid count={3} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredEbooks.map((ebook) => (
                <EbookCard
                  key={ebook.id}
                  ebook={ebook}
                  isPurchased={ownedEbookIds.has(ebook.id)}
                  onSelect={onSelectEbook}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. WHY READ DIGITAL (Editorial Pillars) */}
      <section className="bg-[#F0EBE1] py-16 border-y border-[#E3DBCF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
              Crafted for Focus
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
              Why Read With Folio
            </h2>
            <p className="text-xs sm:text-sm text-[#736B63] mt-2">
              We reject bloated digital apps and DRM restrictions. You buy it, you own it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FBF9F5] p-8 rounded-xl border border-[#E3DBCF]">
              <div className="w-12 h-12 rounded-lg bg-[#1A1817] text-[#E6C994] flex items-center justify-center mb-5">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817] mb-2">
                Unrestricted PDF Downloads
              </h3>
              <p className="text-xs text-[#5A534B] leading-relaxed">
                Download your files to any e-reader, tablet, or desktop. Read offline anytime without proprietary reader apps or subscription locks.
              </p>
            </div>

            <div className="bg-[#FBF9F5] p-8 rounded-xl border border-[#E3DBCF]">
              <div className="w-12 h-12 rounded-lg bg-[#8B2635] text-white flex items-center justify-center mb-5">
                <Feather className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817] mb-2">
                Deep-Dive Rigor
              </h3>
              <p className="text-xs text-[#5A534B] leading-relaxed">
                Our publications skip surface-level tips and focus on foundational engineering, spatial design, and business principles that stand the test of time.
              </p>
            </div>

            <div className="bg-[#FBF9F5] p-8 rounded-xl border border-[#E3DBCF]">
              <div className="w-12 h-12 rounded-lg bg-[#1A1817] text-[#E6C994] flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1A1817] mb-2">
                Verified Razorpay Checkout
              </h3>
              <p className="text-xs text-[#5A534B] leading-relaxed">
                Seamless and secure payment processing with Razorpay. Encrypted cryptographic signatures protect every transaction and guarantee immediate file delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SIMPLE 3-STEP PURCHASE PROCESS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
            Frictionless Access
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-white border border-[#E8E2D9] rounded-xl shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#F0EBE1] text-[#1A1817] font-serif font-bold text-lg flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-serif text-base font-bold text-[#1A1817] mb-2">
              Browse & Select
            </h3>
            <p className="text-xs text-[#736B63] leading-relaxed">
              Explore our curated library of digital titles with detailed chapter previews and sample outlines.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white border border-[#E8E2D9] rounded-xl shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#8B2635] text-white font-serif font-bold text-lg flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-serif text-base font-bold text-[#1A1817] mb-2">
              One-Click Checkout
            </h3>
            <p className="text-xs text-[#736B63] leading-relaxed">
              Pay securely using UPI, Cards, NetBanking, or Wallets via Razorpay with encrypted signature verification.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white border border-[#E8E2D9] rounded-xl shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-[#F0EBE1] text-[#1A1817] font-serif font-bold text-lg flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-serif text-base font-bold text-[#1A1817] mb-2">
              Instant PDF Delivery
            </h3>
            <p className="text-xs text-[#736B63] leading-relaxed">
              Immediately receive high-resolution watermarked PDFs and re-download anytime from your personal library.
            </p>
          </div>
        </div>
      </section>

      {/* 5. LATEST RELEASES */}
      {(loading || latestEbooks.length > 0) && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-3 border-b border-[#E8E2D9]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
                Fresh From The Press
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
                Latest Releases
              </h2>
            </div>
            <button
              onClick={() => onNavigate('/ebooks')}
              className="mt-3 sm:mt-0 text-xs font-semibold text-[#8B2635] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Browse all {loading ? '' : `${latestEbooks.length} `}publications <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <BookCardSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestEbooks.map((ebook) => (
                <EbookCard
                  key={ebook.id}
                  ebook={ebook}
                  isPurchased={ownedEbookIds.has(ebook.id)}
                  onSelect={onSelectEbook}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. CALL TO ACTION BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1A1817] text-white rounded-2xl p-8 sm:p-12 text-center border border-[#2D2A28] shadow-xl">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4 text-[#FBF9F5]">
            Build Your Digital Library Today
          </h2>
          <p className="text-xs sm:text-sm text-[#9E9589] max-w-xl mx-auto mb-8 leading-relaxed">
            Gain immediate access to masterclasses in engineering, architecture, design systems, and modern philosophy.
          </p>
          <button
            onClick={() => onNavigate('/ebooks')}
            className="px-8 py-3.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-sm font-semibold rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>Explore Entire Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
