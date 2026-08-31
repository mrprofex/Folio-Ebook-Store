import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, BookOpen } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, googleLogin } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = useCallback(
    async (idToken: string) => {
      setError(null);
      setLoading(true);
      try {
        await googleLogin(idToken);
      } catch (err: any) {
        setError(err.message || 'Google sign-in failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [googleLogin]
  );

  const handleGoogleError = useCallback((message: string) => {
    setError(message);
    setLoading(false);
  }, []);

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1817]/60 backdrop-blur-xs">
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-[#FBF9F5] border border-[#E8E2D9] shadow-2xl rounded-xl overflow-hidden p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button */}
        <button
          id="btn-close-auth-modal"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-[#736B63] hover:text-[#1A1817] rounded-lg transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#8B2635]/10 text-[#8B2635] mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1A1817]">
            Welcome to Folio
          </h2>
          <p className="text-sm text-[#736B63] mt-1">
            Sign in with Google to access your digital library and downloads.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Google one-click sign in */}
        <div className="space-y-3">
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

          {loading && (
            <div className="flex items-center justify-center gap-2 text-xs text-[#736B63]">
              <span className="inline-block w-4 h-4 border-2 border-[#8B2635] border-t-transparent rounded-full animate-spin" />
              Signing you in…
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#9E9589] border-t border-[#E8E2D9] pt-4">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
