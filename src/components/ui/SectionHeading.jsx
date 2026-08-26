import { cn } from '../../lib/cn'

/**
 * Standard section header: optional eyebrow, heading, optional description.
 * Keep eyebrows rare (see design notes) — most sections don't need one.
 */
export function SectionHeading({ eyebrow, title, description, align = 'left', className }) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' && 'mx-auto text-center',
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="text-3xl text-primary sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-foreground-muted">
          {description}
        </p>
      ) : null}
    </div>
  )
}
