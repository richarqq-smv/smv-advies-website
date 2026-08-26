import { cn } from '../../lib/cn'

/**
 * Constrains content to a readable max width with consistent horizontal
 * gutters. Use inside every <Section> instead of ad-hoc max-w utilities.
 */
export function Container({ className, children, ...props }) {
  return (
    <div className={cn('mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8', className)} {...props}>
      {children}
    </div>
  )
}
