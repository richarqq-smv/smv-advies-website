import { cn } from '../../lib/cn'

const FIELD_CLASSNAME =
  'w-full rounded-lg border bg-white px-3.5 py-3 text-base text-primary placeholder:text-foreground-muted/50 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none'

/** Select-veld in dezelfde visuele taal als TextField/NumberField. */
export function SelectField({ id, label, options, value, onChange, error, optional = false, placeholder = 'Niet bekend' }) {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-foreground-muted">(optioneel)</span> : null}
      </label>
      <select
        id={id}
        name={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(FIELD_CLASSNAME, 'appearance-none bg-no-repeat', error ? 'border-error bg-error-bg' : 'border-border')}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm font-medium text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** Meerregelig tekstveld voor omschrijvingen/opmerkingen. Wordt altijd als platte tekst weergegeven, nooit als HTML. */
export function TextAreaField({ id, label, value, onChange, placeholder, optional = true, rows = 3 }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-foreground-muted">(optioneel)</span> : null}
      </label>
      <textarea
        id={id}
        name={id}
        rows={rows}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD_CLASSNAME, 'resize-y border-border')}
      />
    </div>
  )
}
