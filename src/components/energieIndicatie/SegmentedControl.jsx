import { cn } from '../../lib/cn'

/** Compact single-select control for short option lists (e.g. 1 / 2 / 3+). */
export function SegmentedControl({ id, label, options, value, onChange, error }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div>
      <span className="mb-3 block text-sm font-medium text-primary" id={`${id}-label`}>
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={errorId}
        className={cn(
          'inline-flex w-full gap-1 rounded-lg bg-muted p-1',
          error && 'outline outline-2 outline-offset-2 outline-error/70',
        )}
      >
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-11 flex-1 rounded-md text-sm font-semibold transition-colors duration-200 ease-default',
                selected ? 'bg-white text-primary shadow-sm' : 'text-foreground-muted hover:text-primary',
              )}
            >
              {option.label}
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
