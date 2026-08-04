/**
 * CenterFlow Security & Sanitization Utilities
 * Hardens client-side data handling against XSS, injection, and high-frequency abuse.
 */

/**
 * Escapes HTML characters in untrusted strings to prevent XSS injection.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Strips potentially dangerous HTML tags and script attributes from raw rich text or essay submissions.
 */
export function sanitizeEssayInput(rawText: string): string {
  if (!rawText) return '';
  // Remove script tags and inline event handlers (e.g., onclick=, onerror=, javascript:)
  return rawText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Throttles execution of a function to at most once per waitMs window.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number = 500
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= waitMs) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * Validates role permissions strictly.
 */
export type UserRole = 'student' | 'teacher' | 'admin' | 'guest';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  student: 1,
  teacher: 2,
  admin: 3,
};

export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  if (userRole === 'admin') return true; // Admin has full access
  return requiredRoles.includes(userRole);
}
