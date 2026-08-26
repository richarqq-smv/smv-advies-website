import { cn } from '../../lib/cn'

export function Badge({ children, tone = 'accent', className }) {
  const tones = {
    accent: 'bg-accent text-white',
    muted: 'bg-muted text-primary',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
