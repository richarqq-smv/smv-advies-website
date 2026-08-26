import { cn } from '../../lib/cn'

export function TextField({ id, label, type = 'text', autoComplete, placeholder, value, onChange, error, required = false }) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-required={required}
        aria-describedby={errorId}
        className={cn(
          'w-full rounded-lg border bg-white px-3.5 py-3 text-base text-primary placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none',
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
