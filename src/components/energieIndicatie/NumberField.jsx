import { cn } from '../../lib/cn'

/** Number input with a unit suffix (m², m³, kWh, €/mnd, ...). */
export function NumberField({ id, label, unit, value, onChange, error, placeholder, optional = false, hint }) {
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-foreground-muted">(optioneel)</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'w-full rounded-lg border bg-white px-3.5 py-3 pr-14 text-base text-primary placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none',
            error ? 'border-error bg-error-bg' : 'border-border',
          )}
        />
        <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-medium text-foreground-muted">
          {unit}
        </span>
      </div>
      {hint ? (
        <p id={hintId} className="mt-2 text-xs leading-relaxed text-foreground-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
