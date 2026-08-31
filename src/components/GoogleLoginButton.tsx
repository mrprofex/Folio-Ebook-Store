import React, { useEffect, useRef, useState } from 'react';

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
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

    if (!clientId || clientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      const msg = 'Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in your environment.';
      onError?.(msg);
      setLocalError(msg);
      return;
    }

    setLocalError(null);

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !btnRef.current) return;
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              if (response?.credential) {
                setLocalError(null);
                onSuccess(response.credential);
              } else {
                const msg = 'Google sign-in was cancelled or failed. Please try again.';
                onError?.(msg);
                setLocalError(msg);
              }
            },
            error_callback: (err: any) => {
              const msg = err?.error || 'Google sign-in encountered an error. Please try again.';
              onError?.(msg);
              setLocalError(msg);
            }
          });
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: 'outline',
            size: 'large',
            width: btnRef.current.clientWidth || 320,
            text: 'continue_with'
          });
        } catch (err: any) {
          const msg = err?.message || 'Failed to initialize Google Sign-In.';
          onError?.(msg);
          setLocalError(msg);
        }
      })
      .catch((err) => {
        const msg = err.message || 'Failed to load Google Sign-In';
        onError?.(msg);
        setLocalError(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [onSuccess, onError]);

  if (localError) {
    return (
      <div className="w-full space-y-2">
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
          {localError}
        </div>
        <button
          type="button"
          onClick={() => {
            setLocalError(null);
            onError?.('');
          }}
          className="w-full py-2 px-4 bg-white border border-[#DCD5C9] text-[#1A1817] text-xs font-semibold rounded-lg hover:bg-[#F0EBE1] transition-colors"
        >
          Retry Google Sign-In
        </button>
      </div>
    );
  }

  return <div ref={btnRef} className="flex justify-center min-h-[44px]" />;
};
