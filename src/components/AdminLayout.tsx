import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  Users,
  Store,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Plus,
  Ticket,
  FolderTree
} from 'lucide-react';

interface AdminLayoutProps {
  currentSection: 'dashboard' | 'ebooks' | 'categories' | 'coupons' | 'purchases' | 'users';
  onNavigateSection: (section: 'dashboard' | 'ebooks' | 'categories' | 'coupons' | 'purchases' | 'users') => void;
  onNavigateStore: () => void;
  onOpenNewEbook?: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentSection,
  onNavigateSection,
  onNavigateStore,
  onOpenNewEbook,
  children
}) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ebooks', label: 'Ebook Catalog & Combos', icon: BookOpen },
    { id: 'categories', label: 'Categories', icon: FolderTree },
    { id: 'coupons', label: 'Coupons & Discounts', icon: Ticket },
    { id: 'purchases', label: 'Purchases & Revenue', icon: ShoppingBag },
    { id: 'users', label: 'Users & Customers', icon: Users }
  ] as const;

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        id="admin-sidebar"
        className={`fixed md:sticky top-0 z-50 h-screen w-64 bg-[#1A1817] text-[#D5CEC5] flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Admin Header */}
          <div className="p-6 border-b border-[#2D2A28] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#8B2635] text-white flex items-center justify-center font-serif font-bold">
                F
              </div>
              <div>
                <span className="font-serif text-base font-bold text-white block leading-tight">
                  FOLIO ADMIN
                </span>
                <span className="text-[10px] text-[#9E9589] tracking-wider uppercase">
                  Management Console
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-[#9E9589] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action */}
          {onOpenNewEbook && (
            <div className="px-4 pt-4">
              <button
                id="btn-admin-sidebar-new-ebook"
                onClick={() => {
                  setSidebarOpen(false);
                  onOpenNewEbook();
                }}
                className="w-full py-2 px-3 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add New Ebook
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => {
                    setSidebarOpen(false);
                    onNavigateSection(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#2D2A28] text-white font-semibold'
                      : 'text-[#9E9589] hover:bg-[#252220] hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#E6C994]' : 'text-[#736B63]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#2D2A28] space-y-2">
          <button
            id="btn-admin-return-store"
            onClick={onNavigateStore}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#9E9589] hover:text-white hover:bg-[#252220] rounded-lg transition-colors cursor-pointer"
          >
            <Store className="w-4 h-4 text-[#E6C994]" /> Return to Live Store
          </button>

          <div className="p-2.5 bg-[#252220] rounded-lg flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-[#736B63] truncate">{user?.email}</p>
            </div>
            <button
              id="btn-admin-logout"
              onClick={logout}
              className="p-1.5 text-[#9E9589] hover:text-red-400 rounded transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin Top Mobile Bar */}
        <header className="md:hidden bg-[#1A1817] text-white px-4 py-3 flex items-center justify-between border-b border-[#2D2A28]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-[#D5CEC5] hover:text-white rounded"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-serif font-bold text-sm tracking-wide">
            FOLIO ADMIN
          </span>
          <button
            onClick={onNavigateStore}
            className="text-xs text-[#E6C994] font-medium"
          >
            Live Store
          </button>
        </header>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
