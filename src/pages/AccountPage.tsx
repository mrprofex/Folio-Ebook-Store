import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Purchase } from '../types';
import {
  User as UserIcon,
  Mail,
  Calendar,
  Lock,
  ShoppingBag,
  ShieldCheck,
  Check,
  AlertCircle,
  LogOut
} from 'lucide-react';

interface AccountPageProps {
  onNavigate: (path: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, isAuthenticated, isAdmin, logout, openAuthModal, refreshUser } = useAuth();
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      const loadUserPurchases = async () => {
        try {
          const res = await apiRequest<{ purchases: Purchase[] }>('/api/user/purchases');
          setPurchases(res.purchases || []);
        } catch (e) {
          // ignore
        }
      };
      loadUserPurchases();
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F0EBE1] text-[#1A1817] flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#1A1817] mb-2">
          Account Overview
        </h2>
        <p className="text-xs text-[#736B63] mb-6">
          Please sign in to view your profile settings and purchase history.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 bg-[#8B2635] text-white text-xs font-semibold rounded-lg shadow-xs hover:bg-[#731E2A]"
        >
          Sign In
        </button>
      </div>
    );
  }

  const totalSpent = purchases.reduce((acc, curr) => acc + curr.amount, 0);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setUpdating(true);

    try {
      const payload: any = { name: name.trim() };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      await refreshUser();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 border-b border-[#E8E2D9] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#8B2635] block mb-1">
            Reader Profile
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1817]">
            Account Settings
          </h1>
        </div>

        <button
          id="btn-account-logout"
          onClick={logout}
          className="px-4 py-2 bg-[#F0EBE1] hover:bg-[#EAE4D9] text-[#1A1817] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Stats & Identity */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-6 shadow-2xs text-center">
            <div className="w-16 h-16 rounded-full bg-[#1A1817] text-[#FBF9F5] text-xl font-bold font-serif flex items-center justify-center mx-auto mb-3 uppercase">
              {user.name.charAt(0)}
            </div>
            <h3 className="font-serif text-lg font-bold text-[#1A1817]">{user.name}</h3>
            <p className="text-xs text-[#736B63]">{user.email}</p>
            {isAdmin && (
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold bg-[#8B2635]/15 text-[#8B2635] rounded">
                STORE ADMINISTRATOR
              </span>
            )}
          </div>

          <div className="bg-white border border-[#E8E2D9] rounded-xl p-5 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#736B63] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#8C8276]" /> Owned Ebooks
              </span>
              <strong className="text-[#1A1817] font-semibold">{purchases.length}</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#736B63] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#8C8276]" /> Member Since
              </span>
              <strong className="text-[#1A1817] font-semibold">
                {new Date(user.createdAt).toLocaleDateString()}
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#736B63] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#8C8276]" /> Account Status
              </span>
              <strong className="text-[#1B4332] font-semibold">
                {user.isActive ? 'Active & Verified' : 'Suspended'}
              </strong>
            </div>

            <div className="pt-3 border-t border-[#F0EBE1]">
              <button
                onClick={() => onNavigate('/account/purchases')}
                className="w-full py-2 bg-[#F0EBE1] hover:bg-[#EAE4D9] text-[#1A1817] font-semibold rounded-lg transition-colors text-center block cursor-pointer"
              >
                View Purchased Library
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2">
          <div className="bg-white border border-[#E8E2D9] rounded-xl p-6 sm:p-8 shadow-2xs">
            <h3 className="font-serif text-lg font-bold text-[#1A1817] mb-4 pb-2 border-b border-[#E8E2D9]">
              Edit Profile Information
            </h3>

            {message && (
              <div
                className={`mb-5 p-3 rounded-lg text-xs flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  id="input-profile-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A443E] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 text-sm bg-[#F0EBE1] border border-[#DCD5C9] rounded-lg text-[#736B63] cursor-not-allowed"
                />
                <span className="text-[11px] text-[#8C8276] mt-1 block">
                  Primary email is permanently bound to purchased digital licenses.
                </span>
              </div>

              <div className="pt-4 border-t border-[#E8E2D9]">
                <h4 className="font-serif font-bold text-sm text-[#1A1817] mb-3">
                  Change Password (Optional)
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#736B63] mb-1">
                      Current Password
                    </label>
                    <input
                      id="input-profile-current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#736B63] mb-1">
                      New Password
                    </label>
                    <input
                      id="input-profile-new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg focus:outline-none focus:border-[#8B2635] text-[#1A1817]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  id="btn-profile-save"
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-[#8B2635] hover:bg-[#731E2A] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {updating ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
