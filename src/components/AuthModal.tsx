import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, BookOpen, Mail, Lock, User } from 'lucide-react';
import { GoogleLoginButton } from './GoogleLoginButton';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, googleLogin, login, register, authModalMode, openAuthModal } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!registerName.trim()) {
      setError('Name is required');
      return;
    }
    if (!registerEmail.trim()) {
      setError('Email is required');
      return;
    }
    if (registerPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await register(registerName, registerEmail, registerPassword, registerConfirmPassword);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setError(null);
    setLoginEmail('');
    setLoginPassword('');
    setRegisterName('');
    setRegisterEmail('');
    setRegisterPassword('');
    setRegisterConfirmPassword('');
    openAuthModal(authModalMode === 'login' ? 'register' : 'login');
  };

  if (!isAuthModalOpen) return null;

  const isLoginMode = authModalMode === 'login';

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
            {isLoginMode ? 'Welcome to Folio' : 'Create Account'}
          </h2>
          <p className="text-sm text-[#736B63] mt-1">
            {isLoginMode 
              ? 'Sign in to access your digital library and downloads.' 
              : 'Join Folio to access your digital library and downloads.'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {/* Google one-click sign in */}
        <div className="space-y-3 mb-4">
          <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E2D9]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#FBF9F5] text-[#9E9589]">OR</span>
            </div>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={isLoginMode ? handleEmailLogin : handleRegister} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-semibold text-[#1A1817] mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B63]" />
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5CEC5] rounded-lg text-[#1A1817] focus:outline-none focus:border-[#8B2635] placeholder:text-[#9E9589]"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1A1817] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B63]" />
              <input
                type="email"
                value={isLoginMode ? loginEmail : registerEmail}
                onChange={(e) => isLoginMode ? setLoginEmail(e.target.value) : setRegisterEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5CEC5] rounded-lg text-[#1A1817] focus:outline-none focus:border-[#8B2635] placeholder:text-[#9E9589]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1817] mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B63]" />
              <input
                type="password"
                value={isLoginMode ? loginPassword : registerPassword}
                onChange={(e) => isLoginMode ? setLoginPassword(e.target.value) : setRegisterPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5CEC5] rounded-lg text-[#1A1817] focus:outline-none focus:border-[#8B2635] placeholder:text-[#9E9589]"
                required
                minLength={6}
              />
            </div>
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-xs font-semibold text-[#1A1817] mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B63]" />
                <input
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-[#D5CEC5] rounded-lg text-[#1A1817] focus:outline-none focus:border-[#8B2635] placeholder:text-[#9E9589]"
                  required
                  minLength={6}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#8B2635] text-white text-sm font-semibold rounded-lg hover:bg-[#6B1D2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isLoginMode ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              isLoginMode ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* Toggle between login and register */}
        <div className="mt-4 text-center text-sm text-[#736B63]">
          {isLoginMode ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-[#8B2635] font-semibold hover:underline cursor-pointer"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                className="text-[#8B2635] font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[#9E9589] border-t border-[#E8E2D9] pt-4">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};
