import { useEffect, useState } from 'react';
import { subscribeLoading } from '../lib/api';

/**
 * Global top loading bar. Shows an animated bar whenever the app has any
 * in-flight request to the backend (PostgreSQL) or Cloudinary, so a loading
 * animation always appears during data fetch / save operations.
 */
export function GlobalLoader() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    return subscribeLoading((count) => {
      setActive(count > 0);
    });
  }, []);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] h-[3px] pointer-events-none transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      <div className="loading-bar-track">
        <div className="loading-bar-fill" />
      </div>
    </div>
  );
}
