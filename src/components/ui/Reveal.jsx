import { useInView } from '../../hooks/useInView'
import { cn } from '../../lib/cn'

/**
 * Fades and lifts children into place once they enter the viewport.
 * Honors prefers-reduced-motion globally (see index.css), which collapses
 * the transition duration to near-zero rather than disabling the reveal
 * outright, so content is never stuck invisible.
 */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...props }) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'translate-y-4 opacity-0 transition-all duration-700 ease-default',
        inView && 'translate-y-0 opacity-100',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
