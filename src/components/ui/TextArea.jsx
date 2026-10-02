import { cn } from '../../lib/cn'

/** Zelfde structuur/styling als TextField.jsx, voor een meerregelig veld. */
export function TextArea({ id, label, placeholder, value, onChange, error, required = false, rows = 4 }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={errorId}
        className={cn(
          'w-full resize-y rounded-lg border bg-white px-3.5 py-3 text-base text-primary placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none',
          error ? 'border-error bg-error-bg' : 'border-border',
        )}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
