import { useState } from 'react'
import { Eye, EyeSlash } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

/**
 * Wachtwoordveld met toon/verberg-toggle. Bewust een lokaal, eigen
 * component in plaats van de gedeelde ui/TextField uit te breiden — die
 * wordt op veel plekken hergebruikt die geen wachtwoordgedrag nodig
 * hebben, dit blijft dus specifiek voor de auth-pagina's.
 */
export function WachtwoordVeld({ id, label, value, onChange, required = false, autoComplete }) {
  const [zichtbaar, setZichtbaar] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-primary">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={zichtbaar ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={cn(
            'w-full rounded-lg border border-border bg-white px-3.5 py-3 pr-11 text-base text-primary',
            'focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none',
          )}
        />
        <button
          type="button"
          onClick={() => setZichtbaar((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-foreground-muted hover:text-primary"
          aria-label={zichtbaar ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
        >
          {zichtbaar ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
