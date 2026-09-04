const TOKEN_KEY = 'ebook_store_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// --- Global loading indicator (pub/sub) ---
// Tracks in-flight API requests so the UI can show a loading animation
// whenever the app talks to the backend (DB) or Cloudinary.
let activeRequestCount = 0;
const loadingListeners = new Set<(count: number) => void>();

function notifyLoading() {
  loadingListeners.forEach((cb) => cb(activeRequestCount));
}

export function subscribeLoading(cb: (count: number) => void): () => void {
  loadingListeners.add(cb);
  cb(activeRequestCount);
  return () => {
    loadingListeners.delete(cb);
  };
}

export function getActiveRequestCount(): number {
  return activeRequestCount;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  activeRequestCount += 1;
  notifyLoading();

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = (data && data.message) || (data && data.error) || 'An unexpected error occurred';
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err: any) {
    // Only show network error for actual fetch failures (status 0)
    // For HTTP errors (4xx, 5xx), the response.ok check above already threw with the actual error message
    if (err.name === 'TypeError' && err.message === 'Failed to fetch' && !err.status) {
      const networkError: any = new Error('Network error: Unable to connect to the server. Please check your internet connection.');
      networkError.status = 0;
      networkError.data = { error: 'NETWORK_ERROR', message: networkError.message };
      throw networkError;
    }
    throw err;
  } finally {
    activeRequestCount = Math.max(0, activeRequestCount - 1);
    notifyLoading();
  }
}

export async function uploadFile(file: File): Promise<{ url: string; publicId?: string; fileSize: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/api/upload/file', {
    method: 'POST',
    body: formData
  });
}
