import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  Search,
  Users,
  ShieldCheck,
  UserCheck,
  UserX,
  AlertCircle,
  Calendar,
  CreditCard,
  ShoppingBag,
  RefreshCw
} from 'lucide-react';

interface ExtendedUser extends User {
  purchaseCount: number;
  totalSpent: number;
}

export const AdminUsersPage: React.FC = () => {
  const { user: currentAdmin, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    if (authLoading || !isAuthenticated || !isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ users: ExtendedUser[] }>('/api/admin/users');
      setUsers(res.users || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load users directory');
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, isAuthenticated, isAdmin, fetchUsers]);

  const handleToggleActive = async (userId: string) => {
    setActionMessage(null);
    try {
      const res = await apiRequest<{ user: User; message: string }>(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH'
      });
      setActionMessage({ type: 'success', text: res.message });
      await fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to update user status' });
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1817]">
            User & Customer Directory
          </h1>
          <p className="text-xs text-[#736B63] mt-1">
            Manage customer accounts, verify permissions, monitor library size and total lifetime spending.
          </p>
        </div>

        <div className="px-3.5 py-2 bg-white border border-[#E8E2D9] rounded-lg shadow-2xs text-xs self-start sm:self-auto">
          <span className="text-[#736B63]">Total Registered: </span>
          <strong className="text-[#1A1817] font-semibold">{users.length} Users</strong>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8C8276] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FBF9F5] border border-[#DCD5C9] rounded-lg text-xs text-[#1A1817] focus:outline-none focus:border-[#8B2635]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E8E2D9] rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#736B63]">
            Loading users list...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-xs text-red-600 mb-3">{error}</p>
            <button
              onClick={fetchUsers}
              className="px-3 py-1.5 bg-[#8B2635] text-white text-xs font-semibold rounded-lg hover:bg-[#731E2A] inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
            </button>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBF9F5] text-[#736B63] border-b border-[#E8E2D9]">
                <tr>
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Purchases</th>
                  <th className="py-3 px-4 font-semibold">Total Spent</th>
                  <th className="py-3 px-4 font-semibold">Joined Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Account Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filteredUsers.map((user) => {
                  const isSelf = currentAdmin?.id === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-[#FBF9F5]/70 transition-colors">
                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-[#1A1817] text-white text-[11px] font-bold flex items-center justify-center uppercase shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1A1817] flex items-center gap-1.5">
                              {user.name} {isSelf && <span className="text-[10px] text-[#8B2635] font-normal">(You)</span>}
                            </p>
                            <p className="text-[11px] text-[#736B63]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            user.role === 'ADMIN'
                              ? 'bg-[#8B2635]/15 text-[#8B2635]'
                              : 'bg-[#F0EBE1] text-[#5A534B]'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Purchases count */}
                      <td className="py-3 px-4 font-semibold text-[#1A1817]">
                        {user.purchaseCount} book{user.purchaseCount === 1 ? '' : 's'}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 font-bold text-[#1A1817]">
                        ₹{user.totalSpent.toLocaleString()}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3 px-4 text-[#736B63]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            user.isActive
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {user.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        {isSelf ? (
                          <span className="text-[10px] text-[#8C8276] italic">Protected</span>
                        ) : (
                          <button
                            id={`btn-toggle-user-${user.id}`}
                            onClick={() => handleToggleActive(user.id)}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                              user.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-[#736B63]">
            No users found matching query.
          </div>
        )}
      </div>
    </div>
  );
};
