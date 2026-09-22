import { Check } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Pill-button single-select group. Replaces the source tool's
 * .option-grid / .opt-btn pattern with the same interaction (click to
 * select, one active at a time) in our own visual language.
 *
 * `hints` is an optional { [optionValue]: string } map (e.g. RC_HINT_GEVEL
 * from lib/energieScan/constants) rendered as a small subtext under the
 * matching option's label — grounds a subjective category ("Matig") with a
 * concrete Rc-/U-waarde indication instead of leaving it a pure guess.
 */
export function OptionGrid({ id, label, options, value, onChange, error, hints }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="mb-8 last:mb-0">
      <span className="mb-3 block text-sm font-medium text-primary" id={`${id}-label`}>
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={errorId}
        className={cn(
          'grid grid-cols-2 gap-2.5 sm:grid-cols-3',
          error && 'rounded-lg outline outline-2 outline-offset-2 outline-error/70',
        )}
      >
        {options.map((option) => {
          const selected = value === option.value
          const hint = hints?.[option.value]
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'relative flex min-h-12 items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors duration-200 ease-default',
                selected
                  ? 'border-accent bg-accent/8 text-primary'
                  : 'border-border bg-white text-primary hover:border-primary/30',
              )}
            >
              <span className="flex flex-col gap-0.5">
                <span>{option.label}</span>
                {hint ? <span className="text-xs font-normal text-foreground-muted">{hint}</span> : null}
              </span>
              {selected ? <Check size={16} weight="bold" className="shrink-0 text-accent" /> : null}
            </button>
          )
        })}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
