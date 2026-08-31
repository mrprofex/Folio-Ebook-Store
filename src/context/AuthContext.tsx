import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { apiRequest, getStoredToken, setStoredToken, removeStoredToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword?: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const fetchCurrentUser = async (currentToken: string) => {
    try {
      const data = await apiRequest<{ user: User }>('/api/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      setUser(data.user);
    } catch (err) {
      console.warn('Failed to restore session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthModalOpen(false);
  };

  const register = async (name: string, email: string, password: string, confirmPassword?: string) => {
    const data = await apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword })
    });

    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthModalOpen(false);
  };

  const googleLogin = async (idToken: string) => {
    try {
      const data = await apiRequest<AuthResponse>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken })
      });

      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Google login failed:', err);
      if (err.status === 401) {
        throw new Error('Google authentication failed. Please try again or use email login.');
      } else if (err.message) {
        throw new Error(err.message);
      }
      throw new Error('Google sign-in failed. Please try again later.');
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const data = await apiRequest<AuthResponse>('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Admin login failed:', err);
      if (err.status === 401) {
        throw new Error('Invalid administrator credentials. Please check your email and password.');
      } else if (err.status === 403) {
        throw new Error('Your account does not have administrator privileges.');
      } else if (err.message) {
        throw new Error(err.message);
      }
      throw new Error('Admin login failed. Please try again later.');
    }
  };

  const logout = () => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        isAuthModalOpen,
        authModalMode,
        login,
        register,
        googleLogin,
        adminLogin,
        logout,
        refreshUser,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
