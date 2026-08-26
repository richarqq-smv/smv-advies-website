import { cn } from '../../lib/cn'

/**
 * Self-made SVG wordmark. Deliberately not sourced from Base44 — the
 * rebuilt site owns its own brand assets.
 */
export function Logo({ variant = 'dark', className }) {
  const isLight = variant === 'light'

  return (
    <svg
      viewBox="0 0 168 32"
      className={cn('h-8 w-auto', className)}
      role="img"
      aria-label="SMV Advies"
    >
      <rect width="32" height="32" rx="7" fill={isLight ? '#ffffff' : '#16293A'} />
      <path
        d="M9 21.5V10.8h3.1l3.9 7 3.9-7H23v10.7h-2.9v-6.4l-3.3 5.9h-1.6l-3.3-5.9v6.4H9Z"
        fill={isLight ? '#16293A' : '#C79D55'}
      />
      <text
        x="40"
        y="21.5"
        fontFamily="'Fraunces Variable', Georgia, serif"
        fontSize="17"
        fontWeight="500"
        fill={isLight ? '#ffffff' : '#16293A'}
      >
        SMV Advies
      </text>
    </svg>
  )
}
