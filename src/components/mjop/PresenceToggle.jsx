import { cn } from '../../lib/cn'
import { PRESENCE_OPTIONS } from '../../lib/mjop/constants'

/**
 * Compacte Ja/Nee/Onbekend-toggle voor de aanwezigheid van een
 * bouwdeel/installatie. Bewust geen SegmentedControl (die is full-width,
 * bedoeld voor een los formulierveld) — dit hoort compact naast de
 * kaarttitel te passen.
 */
export function PresenceToggle({ id, value, onChange }) {
  return (
    <div role="group" aria-label="Aanwezig in het pand" className="inline-flex shrink-0 gap-1 rounded-md bg-muted p-1">
      {PRESENCE_OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-8 rounded px-2.5 text-xs font-semibold transition-colors duration-200 ease-default',
              selected ? 'bg-white text-primary shadow-sm' : 'text-foreground-muted hover:text-primary',
            )}
            id={id ? `${id}-${option.value}` : undefined}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
