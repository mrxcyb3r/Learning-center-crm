/**
 * CenterFlow Performance & Asset Preloading Utilities
 * Optimizes Web Vitals (LCP, CLS, INP) and memory usage.
 */

/**
 * Preloads critical images into browser cache before user interaction.
 */
export function preloadImages(imageUrls: string[]): Promise<void[]> {
  const promises = imageUrls.map((url) => {
    return new Promise<void>((resolve) => {
      if (!url) return resolve();
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error to prevent blocking
    });
  });
  return Promise.all(promises);
}

/**
 * Preconnects to third-party domains to reduce initial DNS lookup latency.
 */
export function preconnectDomains(domains: string[]): void {
  domains.forEach((domain) => {
    if (document.querySelector(`link[href="${domain}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Dynamic import wrapper with automatic retry for network resiliency.
 */
export async function lazyRetry<T>(
  componentImport: () => Promise<T>,
  retriesLeft = 2,
  interval = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    componentImport()
      .then(resolve)
      .catch((error) => {
        if (retriesLeft <= 0) {
          reject(error);
          return;
        }
        setTimeout(() => {
          lazyRetry(componentImport, retriesLeft - 1, interval).then(resolve, reject);
        }, interval);
      });
  });
}
