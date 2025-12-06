import { useEffect } from 'react';

// Google Analytics configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    return;
  }

  // Load gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });

  // Make gtag available globally
  (window as any).gtag = gtag;
};

// Track page views
export const trackPageView = (path: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventParams);
  }
};

// Google Analytics component
export function GoogleAnalytics() {
  useEffect(() => {
    initGA();
  }, []);

  return null;
}

