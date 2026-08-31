import React from 'react';

interface AdminLoginPageProps {
  adminEmailInput: string;
  adminPasswordInput: string;
  adminAuthError: string | null;
  adminLoading: boolean;
  authLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReturnToStore: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  adminEmailInput,
  adminPasswordInput,
  adminAuthError,
  adminLoading,
  authLoading,
  isAuthenticated,
  isAdmin,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onReturnToStore
}) => {
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-8 h-8 border-3 border-[#8B2635] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-serif text-sm font-semibold text-[#1A1817]">Verifying Admin Credentials...</p>
          <p className="text-xs text-[#736B63] mt-1">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-[#8B2635]/10 text-[#8B2635] flex items-center justify-center mx-auto mb-5">
            <span className="font-serif text-2xl font-bold">F</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1817] mb-2">
            Administrator Access Required
          </h2>
          <p className="text-xs text-[#736B63] mb-6 leading-relaxed">
            This area is restricted to store managers. Sign in with administrative privileges to manage books, review financial records, and monitor customers.
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            {adminAuthError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {adminAuthError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#4A443E] uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                id="input-admin-email"
                type="email"
                required
                autoComplete="username"
                value={adminEmailInput}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="admin@folio.store"
                className="w-full px-3 py-2 text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-1 focus:ring-[#8B2635] text-[#1A1817]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A443E] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                id="input-admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={adminPasswordInput}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-white border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] focus:ring-1 focus:ring-[#8B2635] text-[#1A1817]"
              />
            </div>

            <button
              id="btn-admin-signin"
              type="submit"
              disabled={adminLoading}
              className="w-full py-2.5 px-4 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {adminLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>

            <button
              id="btn-admin-gate-return-store"
              type="button"
              onClick={onReturnToStore}
              className="w-full py-2 text-xs text-[#736B63] hover:text-[#1A1817] transition-colors cursor-pointer"
            >
              ← Return to Storefront
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
