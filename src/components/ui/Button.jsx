import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-light',
  secondary: 'bg-primary text-white hover:bg-secondary',
  outline: 'border border-primary/20 text-primary hover:bg-muted',
  ghost: 'text-primary hover:bg-muted',
}

const SIZES = {
  md: 'px-6 py-3 text-[0.95rem]',
  sm: 'px-4 py-2 text-sm',
}

/**
 * Renders a <Link> for internal routes, an <a> for external/tel/mailto
 * hrefs, or a <button> when no `to`/`href` is given.
 */
export const Button = forwardRef(function Button(
  { as, to, href, variant = 'primary', size = 'md', className, children, ...props },
  ref,
) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap',
    'transition-colors duration-200 ease-default',
    'active:scale-[0.98]',
    'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )

  if (as === 'link' || to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  )
})
