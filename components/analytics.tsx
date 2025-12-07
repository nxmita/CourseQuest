import { useEffect } from 'react';

// Google Analytics configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    console.warn('Google Analytics: Measurement ID not found');
    return;
  }

  // Check if already initialized
  if ((window as any).dataLayer && (window as any).gtag) {
    return;
  }

  // Initialize dataLayer first
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  
  // Make gtag available immediately (before script loads)
  (window as any).gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname + window.location.hash,
    send_page_view: true
  });

  // Load gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script1.onload = () => {
    console.log('✅ Google Analytics script loaded');
  };
  document.head.appendChild(script1);
};

// Track page views
export const trackPageView = (path: string) => {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) {
    return;
  }
  
  // Ensure dataLayer exists
  if (!(window as any).dataLayer) {
    (window as any).dataLayer = [];
  }
  
  // Use gtag if available, otherwise push to dataLayer directly
  if ((window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      send_page_view: true
    });
  } else {
    // Fallback: push directly to dataLayer
    (window as any).dataLayer.push({
      'event': 'page_view',
      'page_path': path
    });
  }
};

// Track custom events
export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, eventParams);
    } else if ((window as any).dataLayer) {
      (window as any).dataLayer.push({
        'event': eventName,
        ...eventParams
      });
    }
  }
};

// Google Analytics component
export function GoogleAnalytics() {
  useEffect(() => {
    initGA();
  }, []);

  return null;
}
