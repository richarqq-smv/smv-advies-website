import { cn } from '../../lib/cn'

const TONES = {
  white: 'bg-background',
  muted: 'bg-muted',
  primary: 'bg-primary text-white',
}

/**
 * Consistent vertical rhythm wrapper for page sections. Controls spacing
 * and background tone so pages don't hand-roll py-* values individually.
 * Pass `noTopPadding` for a section that sits directly under a PageHero
 * (which already provides its own bottom spacing).
 */
export function Section({ tone = 'white', noTopPadding = false, className, children, ...props }) {
  return (
    <section
      className={cn(
        noTopPadding ? 'pb-16 sm:pb-20 lg:pb-28' : 'py-16 sm:py-20 lg:py-28',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}
