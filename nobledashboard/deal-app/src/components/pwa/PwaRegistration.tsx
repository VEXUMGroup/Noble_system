'use client';

import { useEffect } from 'react';

export function PwaRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch (error) {
        console.error('[PwaRegistration] failed to register service worker', error);
      }
    };

    void register();
  }, []);

  return null;
}

