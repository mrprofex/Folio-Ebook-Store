import React from 'react';
import { ArrowLeft, BookOpen, Mail, ShieldCheck, DownloadCloud, Heart } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#736B63] hover:text-[#1A1817] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 sm:p-10 shadow-2xs space-y-8 text-sm text-[#4A443E] leading-relaxed">
        {/* Header */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
            About Us
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1817] border-b border-[#E8E2D9] pb-4">
            About FOLIO
          </h1>
        </div>

        {/* Brand Introduction */}
        <div>
          <p className="text-base leading-relaxed">
            <strong>FOLIO</strong> is an independent digital publishing imprint and bookstore dedicated to curating deep-dive engineering treatises, design principles, and business playbooks for curious minds.
          </p>
          <p className="mt-4">
            We believe in radical digital simplicity. Our platform delivers premium ebook publications as instant PDF downloads, eliminating physical clutter while providing lifetime access to your personal library.
          </p>
        </div>

        {/* What We Offer */}
        <div>
          <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4 mb-3">What We Offer</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-[#8B2635] mt-0.5 shrink-0" />
              <span>Comprehensive digital guides across software engineering, typography, business architecture, and timeless philosophy.</span>
            </li>
            <li className="flex items-start gap-2">
              <DownloadCloud className="w-4 h-4 text-[#8B2635] mt-0.5 shrink-0" />
              <span>Instant PDF delivery upon successful payment verification.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#8B2635] mt-0.5 shrink-0" />
              <span>Lifetime access to purchased ebooks with unlimited re-downloads from your personal library.</span>
            </li>
          </ul>
        </div>

        {/* Digital-First Approach */}
        <div>
          <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4 mb-3">Digital-First Publishing</h3>
          <p>
            All products on FOLIO are digital ebook files in PDF format. We do not sell or ship physical products. This allows us to:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Deliver content instantly after payment</li>
            <li>Eliminate shipping costs and environmental impact</li>
            <li>Provide lifetime access across all your devices</li>
            <li>Update and improve content over time</li>
          </ul>
        </div>

        {/* Our Commitment */}
        <div>
          <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4 mb-3">Our Commitment</h3>
          <p>
            We are committed to:
          </p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>Curating high-quality, actionable content from expert authors</li>
            <li>Providing secure payment processing through Razorpay</li>
            <li>Protecting your privacy with minimal data collection</li>
            <li>Offering responsive customer support for any technical issues</li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl p-6">
          <h3 className="font-serif font-bold text-base text-[#1A1817] mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#8B2635]" />
            Get in Touch
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#1A1817] uppercase tracking-wider mb-1">Reader Support</p>
              <p className="text-sm text-[#736B63]">support@folio-publishing.com</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1A1817] uppercase tracking-wider mb-1">Author Inquiries</p>
              <p className="text-sm text-[#736B63]">submissions@folio-publishing.com</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-[#E8E2D9] text-xs text-[#736B63]">
          <p className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#8B2635]" />
            Built with care for curious minds worldwide.
          </p>
        </div>
      </div>
    </div>
  );
};
