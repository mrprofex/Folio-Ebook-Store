import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.getElementById('gsi-client-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'gsi-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

export const GoogleLoginButton: React.FC<{
  onSuccess: (idToken: string) => void;
  onError?: (message: string) => void;
}> = ({ onSuccess, onError }) => {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      onError?.('Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !btnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              onSuccess(response.credential);
            } else {
              onError?.('Google sign-in was cancelled or failed.');
            }
          }
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'outline',
          size: 'large',
          width: btnRef.current.clientWidth || 320,
          text: 'continue_with'
        });
      })
      .catch((err) => onError?.(err.message || 'Failed to load Google Sign-In'));

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  return <div ref={btnRef} className="flex justify-center min-h-[44px]" />;
};
