import { cn } from '../../lib/cn'

/**
 * Muted, semantically-ordered 5-step scale (efficient -> inefficient).
 * Kept a green-to-red progression for its universal meaning, desaturated
 * to fit the site's calmer palette rather than the source tool's bright
 * greens/oranges.
 */
const BANDS = [
  { band: 1, color: '#2F6B52', width: '46%' },
  { band: 2, color: '#6B9C6E', width: '60%' },
  { band: 3, color: '#C9A227', width: '74%' },
  { band: 4, color: '#C97B2E', width: '88%' },
  { band: 5, color: '#B5502E', width: '100%' },
]

export function EnergyScale({ currentBand }) {
  return (
    <div aria-hidden="true" className="mx-auto max-w-md">
      <div className="flex flex-col gap-1.5">
        {BANDS.map((b) => (
          <div key={b.band} className="flex items-center">
            <div
              className={cn('h-5 rounded-md transition-opacity duration-400 ease-default', b.band === currentBand ? 'opacity-100' : 'opacity-20')}
              style={{ width: b.width, backgroundColor: b.color }}
            />
            {b.band === currentBand ? (
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none" className="ml-2 shrink-0 text-primary">
                <path d="M0 0L8 6L0 12V0Z" fill="currentColor" />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium text-foreground-muted">
        <span>Veel energieverlies</span>
        <span>Zeer energiezuinig</span>
      </div>
      <p className="mt-3 text-center text-xs leading-relaxed text-foreground-muted">
        Dit toont uw geschatte positie op basis van uw antwoorden — geen officiële classificatie of energielabel.
      </p>
    </div>
  )
}
