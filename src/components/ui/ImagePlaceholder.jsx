import { Image } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Stand-in for photography that doesn't exist yet. Marked up as an image
 * (role="img" + aria-label) so screen readers get the same "there is a
 * picture here" signal a real <img alt="..."> would give, and carries a
 * small visible caption so reviewers can see exactly what needs shooting
 * and where. Swap for a real <img> once photography is available.
 */
export function ImagePlaceholder({ label, aspect = 'aspect-[4/3]', className }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted',
        aspect,
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/10" />
      <div className="relative flex max-w-[70%] flex-col items-center gap-2 text-center">
        <Image size={28} weight="light" className="text-primary/30" />
        <p className="text-xs leading-snug text-foreground-muted">{label}</p>
      </div>
    </div>
  )
}
