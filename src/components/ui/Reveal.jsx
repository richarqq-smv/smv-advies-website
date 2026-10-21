import { useInView } from '../../hooks/useInView'
import { cn } from '../../lib/cn'

/**
 * Fades children in once they enter the viewport. Content is visible by
 * default (server render, no JS, already on screen) — see useInView — and
 * only content that starts below the fold is hidden until it scrolls in.
 * Honors prefers-reduced-motion globally (see index.css), which collapses
 * the transition duration to near-zero.
 *
 * Pro-design-ronde (2026-10-21): alleen nog een opacity-fade (500ms) i.p.v.
 * fade + 16px slide in 700ms. Reveal staat op vrijwel elke homepage-sectie;
 * een fade-and-slide op elke sectie is precies het generieke patroon dat
 * de pro-design-skill afwijst, en 700ms liet content merkbaar op zich
 * wachten.
 */
export function Reveal({ as: Tag = 'div', delay = 0, className, children, ...props }) {
  const [ref, inView] = useInView()

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-opacity duration-500 ease-default',
        !inView && 'opacity-0',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
