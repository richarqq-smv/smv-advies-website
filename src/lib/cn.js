import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges class names and resolves conflicting Tailwind utility classes
 * (e.g. cn('px-2', condition && 'px-4') keeps only 'px-4').
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
