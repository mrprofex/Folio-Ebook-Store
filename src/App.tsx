import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { AdminLayout } from './components/AdminLayout';
import { AdminEbookModal } from './components/AdminEbookModal';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { EbookDetailPage } from './pages/EbookDetailPage';
import { PurchaseSuccessPage } from './pages/PurchaseSuccessPage';
import { MyPurchasesPage } from './pages/MyPurchasesPage';
import { AccountPage } from './pages/AccountPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminEbooksPage } from './pages/AdminEbooksPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminCouponsPage } from './pages/AdminCouponsPage';
import { AdminPurchasesPage } from './pages/AdminPurchasesPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { LegalPage } from './pages/LegalPage';
import { Ebook, Purchase } from './types';
import { apiRequest } from './lib/api';
import { GlobalLoader } from './components/GlobalLoader';

function MainApp() {
  const { user, isAuthenticated, isAdmin, loading: authLoading, login, adminLogin, openAuthModal } = useAuth();

  // Simple and robust routing state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [currentQuery, setCurrentQuery] = useState<string>(() => {
    return window.location.search || '';
  });

  const [selectedEbookSlug, setSelectedEbookSlug] = useState<string | null>(null);
  const [purchaseSuccessId, setPurchaseSuccessId] = useState<string | null>(null);
  const [ownedEbookIds, setOwnedEbookIds] = useState<Set<string>>(new Set());

  // Admin Modal state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState<Ebook | null>(null);
  const [adminRefreshKey, setAdminRefreshKey] = useState(0);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);

  // Sync with browser history
  const navigate = useCallback((pathWithQuery: string, options?: { replace?: boolean }) => {
    const [path, query] = pathWithQuery.split('?');
    setCurrentPath(path || '/');
    setCurrentQuery(query ? `?${query}` : '');
    if (options?.replace) {
      window.history.replaceState({}, '', pathWithQuery);
    } else {
      window.history.pushState({}, '', pathWithQuery);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
      setCurrentQuery(window.location.search || '');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch owned ebook IDs whenever user authenticates
  const fetchOwnedEbooks = useCallback(async () => {
    if (!isAuthenticated) {
      setOwnedEbookIds(new Set());
      return;
    }
    try {
      const res = await apiRequest<{ purchases: Purchase[] }>('/api/user/purchases');
      const ids = new Set((res.purchases || []).map((p) => p.ebookId));
      setOwnedEbookIds(ids);
    } catch (e) {
      // Non-blocking error handling
      setOwnedEbookIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchOwnedEbooks();
  }, [fetchOwnedEbooks]);

  // Admin authentication uses the env ADMIN_EMAIL / ADMIN_PASSWORD via a dedicated form.
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminLoading(true);
    try {
      await adminLogin(adminEmailInput, adminPasswordInput);
    } catch (err: any) {
      setAdminAuthError(err.message || 'Admin login failed. Please check your credentials.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Determine current view
  let viewContent: React.ReactNode = null;
  const isAdminRoute = currentPath.startsWith('/admin');
  const isAdminLoginRoute = currentPath === '/admin/login';

  // Parse path matching
  if (currentPath === '/') {
    viewContent = (
      <HomePage
        onNavigate={navigate}
        onSelectEbook={(ebook) => {
          setSelectedEbookSlug(ebook.slug);
          navigate(`/ebooks/${ebook.slug}`);
        }}
        ownedEbookIds={ownedEbookIds}
      />
    );
  } else if (currentPath === '/ebooks') {
    const urlParams = new URLSearchParams(currentQuery);
    const initialCategory = urlParams.get('category') || 'all';
    const initialSort = urlParams.get('sort') || 'newest';

    viewContent = (
      <BrowsePage
        initialCategory={initialCategory}
        initialSort={initialSort}
        onSelectEbook={(ebook) => {
          setSelectedEbookSlug(ebook.slug);
          navigate(`/ebooks/${ebook.slug}`);
        }}
        ownedEbookIds={ownedEbookIds}
      />
    );
  } else if (currentPath.startsWith('/ebooks/')) {
    const slug = currentPath.replace('/ebooks/', '');
    viewContent = (
      <EbookDetailPage
        slug={slug || selectedEbookSlug || ''}
        onNavigate={navigate}
        onPurchaseSuccess={(purchaseId) => {
          setPurchaseSuccessId(purchaseId);
          fetchOwnedEbooks();
          navigate(`/purchase/success?purchaseId=${purchaseId}`);
        }}
      />
    );
  } else if (currentPath === '/purchase/success') {
    const urlParams = new URLSearchParams(currentQuery);
    const id = urlParams.get('purchaseId') || purchaseSuccessId || '';
    viewContent = (
      <PurchaseSuccessPage
        purchaseId={id}
        onNavigate={navigate}
      />
    );
  } else if (currentPath === '/account/purchases') {
    viewContent = (
      <MyPurchasesPage
        onNavigate={navigate}
        onSelectEbookSlug={(slug) => {
          setSelectedEbookSlug(slug);
          navigate(`/ebooks/${slug}`);
        }}
      />
    );
  } else if (currentPath === '/account') {
    viewContent = <AccountPage onNavigate={navigate} />;
  } else if (isAdminLoginRoute) {
    viewContent = (
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

          <form onSubmit={handleAdminLogin} className="space-y-3">
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
                onChange={(e) => setAdminEmailInput(e.target.value)}
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
                onChange={(e) => setAdminPasswordInput(e.target.value)}
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
              onClick={() => navigate('/')}
              className="w-full py-2 text-xs text-[#736B63] hover:text-[#1A1817] transition-colors cursor-pointer"
            >
              ← Return to Storefront
            </button>
          </form>
        </div>
      </div>
    );
  } else if (isAdminRoute) {
    if (authLoading) {
      viewContent = (
        <div className="min-h-screen bg-[#F4EFE6] flex items-center justify-center p-6">
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-8 max-w-sm w-full text-center shadow-sm">
            <div className="w-8 h-8 border-3 border-[#8B2635] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-serif text-sm font-semibold text-[#1A1817]">Verifying Admin Credentials...</p>
            <p className="text-xs text-[#736B63] mt-1">Please wait a moment.</p>
          </div>
        </div>
      );
    } else if (!isAuthenticated || !isAdmin) {
      navigate('/admin/login', { replace: true });
      viewContent = null;
    } else {
      // Admin Sub-Views
      let adminSection: 'dashboard' | 'ebooks' | 'categories' | 'coupons' | 'purchases' | 'users' = 'dashboard';
      if (currentPath.includes('/categories')) adminSection = 'categories';
      else if (currentPath.includes('/coupons')) adminSection = 'coupons';
      else if (currentPath.includes('/ebooks')) adminSection = 'ebooks';
      else if (currentPath.includes('/purchases')) adminSection = 'purchases';
      else if (currentPath.includes('/users')) adminSection = 'users';

      let adminChild: React.ReactNode = null;
      if (adminSection === 'dashboard') {
        adminChild = (
          <AdminDashboardPage
            onNavigateSection={(sec) => navigate(`/admin/${sec === 'dashboard' ? '' : sec}`)}
            onOpenNewEbook={() => {
              setEditingEbook(null);
              setIsAdminModalOpen(true);
            }}
          />
        );
      } else if (adminSection === 'ebooks') {
        adminChild = (
          <AdminEbooksPage
            key={adminRefreshKey}
            onOpenNewEbook={() => {
              setEditingEbook(null);
              setIsAdminModalOpen(true);
            }}
            onEditEbook={(ebook) => {
              setEditingEbook(ebook);
              setIsAdminModalOpen(true);
            }}
          />
        );
      } else if (adminSection === 'categories') {
        adminChild = <AdminCategoriesPage />;
      } else if (adminSection === 'coupons') {
        adminChild = <AdminCouponsPage />;
      } else if (adminSection === 'purchases') {
        adminChild = <AdminPurchasesPage />;
      } else if (adminSection === 'users') {
        adminChild = <AdminUsersPage />;
      }

      viewContent = (
        <AdminLayout
          currentSection={adminSection}
          onNavigateSection={(sec) => navigate(`/admin/${sec === 'dashboard' ? '' : sec}`)}
          onNavigateStore={() => navigate('/')}
          onOpenNewEbook={() => {
            setEditingEbook(null);
            setIsAdminModalOpen(true);
          }}
        >
          {adminChild}
        </AdminLayout>
      );
    }
  } else if (['/terms', '/privacy', '/refunds', '/contact'].includes(currentPath)) {
    const sec = currentPath.replace('/', '') as 'terms' | 'privacy' | 'refunds' | 'contact';
    viewContent = <LegalPage section={sec} onNavigate={navigate} />;
  } else {
    // Default fallback to 404 or home
    viewContent = (
      <div className="max-w-md mx-auto py-24 text-center px-4">
        <h2 className="font-serif text-3xl font-bold text-[#1A1817] mb-2">Page Not Found</h2>
        <p className="text-xs text-[#736B63] mb-6">The requested publication or directory could not be located.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-[#8B2635] text-white text-xs font-semibold rounded-lg"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1A1817] antialiased selection:bg-[#8B2635]/20 selection:text-[#8B2635]">
      {/* Global loading bar: shows during any backend / Cloudinary request */}
      <GlobalLoader />

      {/* If not in admin layout, render public Navbar */}
      {!isAdminRoute && (
        <Navbar
          currentPath={currentPath}
          onNavigate={navigate}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {viewContent}
      </main>

      {/* If not in admin layout, render public Footer */}
      {!isAdminRoute && (
        <Footer onNavigate={navigate} />
      )}

      {/* Global Auth Modal for login/signup */}
      <AuthModal />

      {/* Global Admin Modal for Creating/Editing Ebooks */}
      <AdminEbookModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSaved={() => {
          setAdminRefreshKey((k) => k + 1);
          fetchOwnedEbooks();
        }}
        initialData={editingEbook}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
