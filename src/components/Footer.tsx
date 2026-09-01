import React from 'react';
import { BookOpen, ShieldCheck, Lock, FileText, DownloadCloud } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#1A1817] text-[#D5CEC5] border-t border-[#2D2A28] mt-24">
      {/* Trust bar */}
      <div className="border-b border-[#2D2A28] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#262321] text-[#E6C994] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#FBF9F5]">Secure Razorpay Checkout</h4>
              <p className="text-xs text-[#9E9589] mt-0.5">256-bit encrypted server-verified payment processing.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#262321] text-[#E6C994] flex items-center justify-center shrink-0">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#FBF9F5]">Instant Digital Delivery</h4>
              <p className="text-xs text-[#9E9589] mt-0.5">Immediate PDF download & lifetime library re-downloads.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#262321] text-[#E6C994] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#FBF9F5]">Verified Intellectual Property</h4>
              <p className="text-xs text-[#9E9589] mt-0.5">Authentic publications direct from curated authors.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded bg-[#8B2635] text-[#FBF9F5] flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-serif text-lg font-bold text-[#FBF9F5] tracking-tight">FOLIO</span>
            </div>
            <p className="text-xs text-[#9E9589] leading-relaxed max-w-sm">
              An independent digital publishing imprint and bookstore. We curate deep-dive engineering treatises, design principles, and business playbooks for curious minds.
            </p>
            <p className="text-[11px] text-[#736B63] mt-4">
              Protected by cryptographic ownership verification and automated digital delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#FBF9F5] mb-3">Catalog & Reader</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/ebooks')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  All Ebooks
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/ebooks?sort=featured')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  Featured Titles
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/account/purchases')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  My Purchased Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/account')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  Account Settings
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  About FOLIO
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#FBF9F5] mb-3">Legal & Trust</h5>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy-policy')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/refunds')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/delivery')}
                  className="hover:text-[#FBF9F5] transition-colors cursor-pointer"
                >
                  Digital Delivery
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-[#2D2A28] mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#736B63]">
          <p>© {new Date().getFullYear()} FOLIO Digital Store. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 flex items-center gap-2">
            <span>Powered by Razorpay & Cloud Storage</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
