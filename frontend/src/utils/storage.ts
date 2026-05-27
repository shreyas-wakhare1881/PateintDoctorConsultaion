/**
 * LocalStorage Utilities — safe wrappers for SSR-safe access.
 */

const isBrowser = typeof window !== 'undefined';

export const storage = {
  get: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or private browsing — fail silently.
    }
  },

  remove: (key: string): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Fail silently.
    }
  },

  clear: (): void => {
    if (!isBrowser) return;
    try {
      window.localStorage.clear();
    } catch {
      // Fail silently.
    }
  },
};
