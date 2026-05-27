/**
 * className merger — combines clsx + tailwind-merge.
 * Prevents Tailwind class conflicts (e.g. `p-4 p-6` → `p-6`).
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
