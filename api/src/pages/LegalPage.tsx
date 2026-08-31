import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, FileText, RefreshCw } from 'lucide-react';

interface LegalPageProps {
  section: 'terms' | 'privacy' | 'refunds' | 'contact';
  onNavigate: (path: string) => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ section, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <button
        onClick={() => onNavigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#736B63] hover:text-[#1A1817] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </button>

      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 sm:p-10 shadow-2xs space-y-6 text-sm text-[#4A443E] leading-relaxed">
        {section === 'terms' && (
          <>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
              Agreement
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1A1817] border-b border-[#E8E2D9] pb-4">
              Terms of Service & Digital License
            </h1>
            <p>
              By purchasing and downloading digital publications from <strong>FOLIO Publishing</strong>, you agree to the following terms and conditions:
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">1. Digital Ownership & Personal License</h3>
            <p>
              When you purchase an ebook on this store, you are granted a perpetual, non-exclusive, non-transferable personal reader license. You are permitted to download and store the PDF file on any of your personal devices (e-readers, laptops, smartphones, tablets).
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">2. Copyright & Intellectual Property</h3>
            <p>
              All texts, diagrams, typography, and visual assets remain the exclusive intellectual property of the author and FOLIO Publishing. Redistribution, reselling, public file sharing, torrenting, or uploading to public forums or AI training datasets without written consent is strictly prohibited.
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">3. Watermarking & Security</h3>
            <p>
              Purchased digital copies may include subtle cryptographic watermarks tied to your verified account identifier to discourage unauthorized commercial piracy.
            </p>
          </>
        )}

        {section === 'privacy' && (
          <>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
              Data Protection
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1A1817] border-b border-[#E8E2D9] pb-4">
              Privacy & Security Policy
            </h1>
            <p>
              At FOLIO, we believe in radical digital simplicity. We collect only what is strictly necessary to process your transactions and deliver your digital assets.
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">1. Data Collected</h3>
            <p>
              We collect your name and email address to authenticate your session and associate purchased digital book licenses with your permanent account.
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">2. Payment Security</h3>
            <p>
              We never store your credit card numbers, UPI PINs, or banking passwords on our servers. All financial transactions are processed securely through <strong>Razorpay</strong> via PCI-DSS compliant protocols.
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">3. Third-Party Sharing</h3>
            <p>
              We do not sell, rent, or monetize your personal information to third-party ad networks or tracking brokers.
            </p>
          </>
        )}

        {section === 'refunds' && (
          <>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
              Customer Guarantee
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1A1817] border-b border-[#E8E2D9] pb-4">
              Digital Goods Refund Policy
            </h1>
            <p>
              Because digital goods (PDF ebooks) are delivered instantly upon successful payment completion, standard physical returns do not apply. However, we guarantee customer satisfaction:
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">1. Defective or Corrupt Files</h3>
            <p>
              If a file download fails or is corrupted due to server delivery issues, our support team will manually re-issue a clean copy immediately or process a full refund.
            </p>
            <h3 className="font-serif font-bold text-base text-[#1A1817] mt-4">2. Duplicate Charges</h3>
            <p>
              If you are accidentally billed multiple times for the same transaction due to a network glitch, our automated payment ledger will detect and refund the duplicate amount within 3–5 business days.
            </p>
          </>
        )}

        {section === 'contact' && (
          <>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
              Support & Imprint
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1A1817] border-b border-[#E8E2D9] pb-4">
              Contact Editorial & Support
            </h1>
            <p>
              Have questions about a publication, manuscript submissions, or payment issues? We are here to help.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl">
                <Mail className="w-5 h-5 text-[#8B2635] mb-2" />
                <h4 className="font-bold text-xs text-[#1A1817] uppercase tracking-wider mb-1">Reader Support</h4>
                <p className="text-xs text-[#736B63]">support@folio-publishing.com</p>
              </div>
              <div className="p-4 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl">
                <FileText className="w-5 h-5 text-[#8B2635] mb-2" />
                <h4 className="font-bold text-xs text-[#1A1817] uppercase tracking-wider mb-1">Author Inquiries</h4>
                <p className="text-xs text-[#736B63]">submissions@folio-publishing.com</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
