import { useState } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'

/**
 * Compacte voortgangsbalk + directe stapnavigatie (mobiele-opnameronde) —
 * "duidelijke voortgang" + "makkelijk terug/vooruit" (opdracht §4): een
 * korte titel/voortgangsbalk die altijd zichtbaar blijft, met een
 * uitklapbare lijst om direct naar een willekeurige stap te springen (niet
 * verplicht lineair doorlopen — een inspecteur mag tussentijds naar de
 * Checklist en weer terug naar een onderdeel).
 */
export function OpnameStapper({ stappen, huidigeIndex, voltooideIndices, onSpringNaar }) {
  const [open, setOpen] = useState(false)
  const huidige = stappen[huidigeIndex]

  return (
    <div className="sticky top-14 z-30 border-b border-border bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-2 px-4 py-2 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="block text-xs text-foreground-muted">
            Stap {huidigeIndex + 1} van {stappen.length}
          </span>
          <span className="block truncate text-sm font-medium text-primary">{huidige.label}</span>
        </span>
        <CaretDown size={16} className={`shrink-0 text-foreground-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className="h-1 w-full bg-muted">
        <div className="h-full bg-accent transition-all" style={{ width: `${((huidigeIndex + 1) / stappen.length) * 100}%` }} />
      </div>
      {open ? (
        <ul className="max-h-[60vh] overflow-y-auto border-t border-border">
          {stappen.map((stap, index) => (
            <li key={stap.key}>
              <button
                type="button"
                onClick={() => {
                  onSpringNaar(index)
                  setOpen(false)
                }}
                className={`flex min-h-11 w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-muted ${index === huidigeIndex ? 'bg-accent/5 font-medium text-accent' : 'text-primary'}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${voltooideIndices.has(index) ? 'border-accent bg-accent text-white' : 'border-border text-foreground-muted'}`}>
                  {voltooideIndices.has(index) ? <Check size={12} weight="bold" /> : index + 1}
                </span>
                {stap.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
