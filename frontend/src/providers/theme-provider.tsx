'use client';

/**
 * ThemeProvider — wraps next-themes.
 *
 * Hydration note: do NOT read from useThemeStore (Zustand localStorage) here.
 * Zustand persist is client-side only; reading it during SSR produces a
 * different value than the server render → React hydration mismatch.
 * next-themes handles its own persistence via cookies + localStorage internally
 * and is already SSR-safe when suppressHydrationWarning is set on <html>.
 */

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
