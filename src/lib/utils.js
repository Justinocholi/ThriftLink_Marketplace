import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes intelligently — later classes win, duplicates dropped.
 * Used by every shadcn component for the `className` prop.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
