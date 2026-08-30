import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, ShoppingBag, User as UserIcon, LogOut, Shield, Menu, X, ChevronDown } from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onSearchFocus?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onSearchFocus }) => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <div 
            id="brand-logo-btn"
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-[#1A1817] text-[#FBF9F5] flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <BookOpen className="w-5 h-5 text-[#E6C994]" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#1A1817] block leading-none">
                FOLIO
              </span>
              <span className="text-[10px] font-sans tracking-widest text-[#736B63] uppercase block mt-1">
                Digital Publications
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              id="nav-link-browse"
              onClick={() => handleNav('/ebooks')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                currentPath === '/ebooks'
                  ? 'text-[#8B2635] font-semibold'
                  : 'text-[#5A534B] hover:text-[#1A1817]'
              }`}
            >
              Browse Ebooks
            </button>

            {isAuthenticated && (
              <button
                id="nav-link-my-purchases"
                onClick={() => handleNav('/account/purchases')}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentPath === '/account/purchases'
                    ? 'text-[#8B2635] font-semibold'
                    : 'text-[#5A534B] hover:text-[#1A1817]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>My Library</span>
              </button>
            )}

            {isAdmin && (
              <button
                id="nav-link-admin-panel"
                onClick={() => handleNav('/admin')}
                className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider bg-[#8B2635]/10 text-[#8B2635] hover:bg-[#8B2635]/20 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Panel
              </button>
            )}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Quick search button */}
            <button
              id="btn-nav-search-trigger"
              onClick={() => {
                if (currentPath !== '/ebooks') {
                  handleNav('/ebooks');
                }
                if (onSearchFocus) onSearchFocus();
              }}
              className="p-2 text-[#736B63] hover:text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg transition-colors cursor-pointer"
              title="Search catalog"
            >
              <Search className="w-5 h-5" />
            </button>

            {isAuthenticated && user ? (
              /* User Profile Menu */
              <div className="relative">
                <button
                  id="btn-user-avatar-menu"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 bg-[#F0EBE1] hover:bg-[#E8E1D5] rounded-full border border-[#DCD5C9] transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#1A1817] text-white text-xs font-bold flex items-center justify-center uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium text-[#1A1817] max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#736B63]" />
                </button>

                {userMenuOpen && (
                  <div 
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-56 bg-[#FBF9F5] border border-[#E8E2D9] rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95"
                  >
                    <div className="px-4 py-2 border-b border-[#E8E2D9]">
                      <p className="text-xs font-semibold text-[#1A1817] truncate">{user.name}</p>
                      <p className="text-[11px] text-[#736B63] truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold bg-[#8B2635]/15 text-[#8B2635] rounded">
                          ADMINISTRATOR
                        </span>
                      )}
                    </div>

                    <button
                      id="dropdown-link-account"
                      onClick={() => handleNav('/account')}
                      className="w-full px-4 py-2 text-xs text-left text-[#3D3731] hover:bg-[#F0EBE1] flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-[#736B63]" /> Account Overview
                    </button>

                    <button
                      id="dropdown-link-purchases"
                      onClick={() => handleNav('/account/purchases')}
                      className="w-full px-4 py-2 text-xs text-left text-[#3D3731] hover:bg-[#F0EBE1] flex items-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4 text-[#736B63]" /> Purchased Ebooks
                    </button>

                    {isAdmin && (
                      <button
                        id="dropdown-link-admin"
                        onClick={() => handleNav('/admin')}
                        className="w-full px-4 py-2 text-xs text-left text-[#8B2635] font-semibold hover:bg-[#8B2635]/10 flex items-center gap-2 cursor-pointer border-t border-[#E8E2D9]"
                      >
                        <Shield className="w-4 h-4" /> Admin Console
                      </button>
                    )}

                    <div className="border-t border-[#E8E2D9] my-1"></div>

                    <button
                      id="dropdown-link-logout"
                      onClick={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Logged Out Buttons */
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => openAuthModal('login')}
                  className="px-4 py-2 text-xs font-semibold text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-2 text-xs font-semibold bg-[#8B2635] hover:bg-[#731E2A] text-white rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#1A1817] hover:bg-[#F0EBE1] rounded-lg cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-drawer-menu"
          className="md:hidden border-t border-[#E8E2D9] bg-[#FBF9F5] px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2"
        >
          <button
            onClick={() => handleNav('/ebooks')}
            className="w-full text-left py-2 text-sm font-medium text-[#1A1817] border-b border-[#E8E2D9]/60 flex items-center justify-between"
          >
            <span>Browse Catalog</span>
            <Search className="w-4 h-4 text-[#736B63]" />
          </button>

          {isAuthenticated ? (
            <>
              <button
                onClick={() => handleNav('/account/purchases')}
                className="w-full text-left py-2 text-sm font-medium text-[#1A1817] border-b border-[#E8E2D9]/60 flex items-center justify-between"
              >
                <span>My Library & Purchases</span>
                <ShoppingBag className="w-4 h-4 text-[#736B63]" />
              </button>

              <button
                onClick={() => handleNav('/account')}
                className="w-full text-left py-2 text-sm font-medium text-[#1A1817] border-b border-[#E8E2D9]/60 flex items-center justify-between"
              >
                <span>My Profile</span>
                <UserIcon className="w-4 h-4 text-[#736B63]" />
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleNav('/admin')}
                  className="w-full text-left py-2 text-sm font-bold text-[#8B2635] border-b border-[#E8E2D9]/60 flex items-center justify-between"
                >
                  <span>Admin Dashboard</span>
                  <Shield className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left py-2 text-sm font-medium text-red-600 flex items-center justify-between"
              >
                <span>Sign Out ({user?.name})</span>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-[#1A1817] bg-[#F0EBE1] rounded-lg"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('register');
                }}
                className="w-full py-2.5 text-center text-xs font-semibold bg-[#8B2635] text-white rounded-lg"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
