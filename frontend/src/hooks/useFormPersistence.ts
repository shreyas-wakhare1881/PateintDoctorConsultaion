/**
 * useFormPersistence — Persists react-hook-form state to sessionStorage.
 * Source of truth: frontend/SDD/auth.md §11 Form State Persistence
 *
 * Designed for multi-step or long forms (e.g. doctor registration).
 * Uses sessionStorage (tab-scoped, auto-clears on tab close) — safer than localStorage.
 *
 * Usage:
 *   const { clearPersisted } = useFormPersistence('doctor-register', watch, reset);
 */

import { useEffect, useCallback } from 'react';
import { UseFormWatch, UseFormReset, FieldValues } from 'react-hook-form';

const DEBOUNCE_MS = 600;

export function useFormPersistence<T extends FieldValues>(
  key: string,
  watch: UseFormWatch<T>,
  reset: UseFormReset<T>
) {
  const storageKey = `pdc_form_${key}`;

  // Restore persisted values on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const values = JSON.parse(raw) as T;
      // Strip sensitive fields before restoring
      const safe = { ...values } as Partial<T>;
      delete (safe as Record<string, unknown>).password;
      delete (safe as Record<string, unknown>).confirmPassword;
      reset(safe as T, { keepDefaultValues: true });
    } catch {
      // Corrupt data — ignore silently
      sessionStorage.removeItem(storageKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist with debounce on every form change
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const subscription = watch((values) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        try {
          // Never persist passwords
          const safe = { ...values };
          delete (safe as Record<string, unknown>).password;
          delete (safe as Record<string, unknown>).confirmPassword;
          sessionStorage.setItem(storageKey, JSON.stringify(safe));
        } catch {
          // Storage quota or unavailable — ignore
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [watch, storageKey]);

  /** Call this after successful submission to clean up. */
  const clearPersisted = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  return { clearPersisted };
}
